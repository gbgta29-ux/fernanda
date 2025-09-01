'use server';

import { generateResponse, GenerateResponseOutput } from '@/ai/flows/generate-response';

export async function sendMessage(message: string): Promise<GenerateResponseOutput> {
  try {
    const response = await generateResponse({ message });
    return response;
  } catch (error) {
    console.error("Error generating response:", error);
    return { response: "Desculpe, não consegui processar sua mensagem. Tente novamente mais tarde." };
  }
}

export interface PixChargeData {
  pixCopyPaste: string;
  transactionId: string;
}

export async function createPixCharge(value: number): Promise<PixChargeData | null> {
  try {
    const url = new URL('https://api.pushinpay.com.br/api/pix/cashIn');
    url.searchParams.append('timestamp', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 37882|6mVxPEZ5x7yJEmsJ4W6vAS52FGSKG6vGbZRAsq4Rb47c654c',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: value, // Value in cents
        webhook_url: "http://seuservico.com/webhook"
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to create PIX charge:", response.status, errorText);
      return null;
    }

    const responseData = await response.json();
    console.log("PIX Charge API Response:", JSON.stringify(responseData, null, 2));

    const data = responseData.data || responseData;
    
    return {
      pixCopyPaste: data.qr_code || data.br_code,
      transactionId: data.id,
    };
  } catch (error) {
    console.error("Error creating PIX charge:", error);
    return null;
  }
}

export async function checkPaymentStatus(transactionId: string): Promise<{ status: string } | null> {
  try {
    const url = new URL(`https://api.pushinpay.com.br/api/transactions/${transactionId}`);
    url.searchParams.append('timestamp', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer 37882|6mVxPEZ5x7yJEmsJ4W6vAS52FGSKG6vGbZRAsq4Rb47c654c',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to check payment status:", response.status, errorText);
      return null;
    }
    const responseData = await response.json();
    const data = responseData.data || responseData;
    return { status: data.status };
  } catch (error) {
    console.error("Error checking payment status:", error);
    return null;
  }
}
