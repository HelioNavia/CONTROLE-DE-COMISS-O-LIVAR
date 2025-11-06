import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../utils/audio';
import { MicrophoneIcon, StopCircleIcon, CloseIcon } from './icons';

const LiveAgentWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [transcriptions, setTranscriptions] = useState<{user: string, bot: string}[]>([]);
    
    const sessionPromiseRef = useRef<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const isStoppingRef = useRef(false);

    const stopConversation = useCallback(async () => {
        if (isStoppingRef.current) return;
        isStoppingRef.current = true;

        setIsActive(false);
        setIsConnecting(false);

        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();

        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (error) {
                console.error("Error closing session:", error);
            }
            sessionPromiseRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close();
        }
        audioContextRef.current = null;
        
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            await outputAudioContextRef.current.close();
        }
        outputAudioContextRef.current = null;

        isStoppingRef.current = false;
    }, []);

    const startConversation = async () => {
        if (isActive || isConnecting) return;
        
        setIsConnecting(true);
        setTranscriptions([]);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API key not found.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            let nextStartTime = 0;
            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        console.log('Live session opened.');
                        try {
                            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

                            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                                if (!audioContextRef.current) return;

                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const sourceSampleRate = audioContextRef.current.sampleRate;
                                const targetSampleRate = 16000;
                                let finalData = inputData;

                                if (sourceSampleRate > targetSampleRate) {
                                    const sampleRateRatio = sourceSampleRate / targetSampleRate;
                                    const newLength = Math.round(inputData.length / sampleRateRatio);
                                    const result = new Float32Array(newLength);
                                    let offsetResult = 0;
                                    let offsetBuffer = 0;
                                    while (offsetResult < newLength) {
                                        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
                                        let accum = 0, count = 0;
                                        for (let i = offsetBuffer; i < nextOffsetBuffer && i < inputData.length; i++) {
                                            accum += inputData[i];
                                            count++;
                                        }
                                        result[offsetResult] = count > 0 ? accum / count : 0;
                                        offsetResult++;
                                        offsetBuffer = nextOffsetBuffer;
                                    }
                                    finalData = result;
                                }
                                
                                const pcmBlob = createBlob(finalData);
                                if(sessionPromiseRef.current){
                                    sessionPromiseRef.current.then((session) => {
                                        session.sendRealtimeInput({ media: pcmBlob });
                                    });
                                }
                            };
                            source.connect(scriptProcessorRef.current);
                            scriptProcessorRef.current.connect(audioContextRef.current.destination);
                            setIsConnecting(false);
                            setIsActive(true);
                        } catch (err) {
                            console.error("Error setting up audio stream:", err);
                            alert("Não foi possível acessar o microfone. Verifique as permissões e tente novamente.");
                            stopConversation();
                        }
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            setTranscriptions(prev => [...prev, {user: currentInputTranscription, bot: currentOutputTranscription}]);
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }
                        
                        if (message.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(source => source.stop());
                            audioSourcesRef.current.clear();
                            nextStartTime = 0;
                            currentOutputTranscription = '';
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const outputAudioContext = outputAudioContextRef.current;
                            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);

                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                            });
                            audioSourcesRef.current.add(source);

                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        alert("Ocorreu um erro na conexão. Por favor, tente novamente.");
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        console.log('Live session closed.');
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                },
            });
        } catch (error) {
            console.error("Failed to start conversation:", error);
            alert("Não foi possível iniciar a conversa. Verifique as permissões do microfone e a chave de API.");
            setIsConnecting(false);
        }
    };
    
    const handleToggleWidget = () => {
      if(isOpen) {
        stopConversation();
      }
      setIsOpen(!isOpen);
    }

    return (
        <>
        <button
          onClick={handleToggleWidget}
          className="fixed bottom-6 right-24 bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-transform transform hover:scale-110 z-50"
          aria-label="Assistente de Voz"
        >
          {isOpen ? <CloseIcon /> : <MicrophoneIcon />}
        </button>
  
        {isOpen && (
          <div className="fixed bottom-24 right-6 w-[90vw] max-w-md h-[70vh] max-h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50">
            <header className="bg-red-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
              <h3 className="font-bold text-lg">Assistente de Voz</h3>
            </header>
  
            <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {transcriptions.map((t, i) => (
                    <div key={i}>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Você: <span className="text-gray-700 dark:text-gray-300 font-normal">{t.user}</span></p>
                        <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Assistente: <span className="text-gray-700 dark:text-gray-300 font-normal">{t.bot}</span></p>
                    </div>
                ))}
                {!isActive && !isConnecting && transcriptions.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400">Pressione o botão para iniciar a conversa.</p>
                )}
            </div>
  
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center items-center">
              {!isActive ? (
                <button onClick={startConversation} disabled={isConnecting} className="w-16 h-16 bg-red-600 rounded-full text-white flex items-center justify-center transition-all hover:bg-red-700 disabled:bg-red-400">
                    {isConnecting ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <MicrophoneIcon />
                    )}
                </button>
              ) : (
                <button onClick={stopConversation} className="w-16 h-16 bg-gray-600 rounded-full text-white flex items-center justify-center transition-all hover:bg-gray-700">
                    <StopCircleIcon />
                </button>
              )}
            </div>
          </div>
        )}
      </>
    );
};

export default LiveAgentWidget;