
import { GoogleGenAI } from '@google/genai';
import { Sale, ChatMessage } from '../types';

export const analyzeSalesData = async (sales: Sale[]): Promise<string> => {
  if (!process.env.API_KEY) return "Chave de API não configurada.";
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Você é um analista de vendas sênior para uma equipe imobiliária no Brasil. Com base nos seguintes dados de vendas em formato JSON, forneça um resumo conciso dos principais indicadores de desempenho. Destaque a construtora com melhor desempenho, o valor total das vendas, e o total de comissões pagas e pendentes aos vendedores. O status de pagamento é indicado pelo campo 'statusPagamento' ('Pago', 'Pendente', ou 'Pago Parcialmente'). O valor da comissão já paga está no campo 'valorComissaoPaga'. O 'statusRepasse' detalha a fase do processo de comissão. A comissão total do vendedor é calculada como 'valorTotalVenda' * ('porcentagemComissaoTotal' / 100) * ('porcentagemComissaoVendedor' / 100). Responda em português (pt-BR) e em markdown. Dados: ${JSON.stringify(sales, null, 2)}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing sales data with Gemini:", error);
    throw new Error("Falha ao analisar os dados de vendas.");
  }
};

export const generateChatResponse = async (userInput: string, salesContext: Sale[]): Promise<ChatMessage> => {
    if (!process.env.API_KEY) {
        return {
            id: 'error-no-key',
            sender: 'bot',
            text: 'A chave de API não foi configurada. Não consigo me conectar.'
        };
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `Você é o ComissioBot, um assistente prestativo para uma equipe de vendas de imóveis. Use os dados de vendas fornecidos para responder às perguntas com precisão. O status de pagamento é indicado pelo campo 'statusPagamento' ('Pago', 'Pendente' ou 'Pago Parcialmente'). O valor efetivamente pago da comissão está no campo 'valorComissaoPaga'. O 'statusRepasse' detalha a fase do processo de comissão ('NFS-e pendenciada', 'NFS-e aprovada', 'Liberado', etc.). A comissão total do vendedor é calculada como 'valorTotalVenda' * ('porcentagemComissaoTotal' / 100) * ('porcentagemComissaoVendedor' / 100). O valor pendente é a diferença entre a comissão total e o 'valorComissaoPaga'. Se a pergunta for sobre notícias recentes, tendências de mercado ou locais específicos, use suas ferramentas de busca e mapas para fornecer informações atualizadas. Responda em português (pt-BR). Aqui estão os dados de vendas atuais: ${JSON.stringify(salesContext, null, 2)}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userInput,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }, { googleMaps: {} }],
            }
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: { uri: string; title: string }[] = [];
        
        if (groundingChunks) {
            for (const chunk of groundingChunks) {
                if(chunk.web) {
                    sources.push({ uri: chunk.web.uri, title: chunk.web.title });
                }
                if (chunk.maps) {
                    sources.push({ uri: chunk.maps.uri, title: chunk.maps.title });
                }
            }
        }

        return {
            id: 'bot-' + Date.now().toString(),
            sender: 'bot',
            text: response.text,
            sources: sources.length > 0 ? sources : undefined
        };

    } catch (error) {
        console.error("Error generating chat response with Gemini:", error);
        throw new Error("Falha ao gerar resposta do chat.");
    }
};