import { Linking } from 'react-native';

export const sendWhatsAppMessage = (phone: string, message: string) => {
    const url = `whatsapp://send?text=${encodeURIComponent(message)}&phone=${phone}`;
    return Linking.openURL(url).catch(() => {
        // Fallback if WhatsApp is not installed
        const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        return Linking.openURL(webUrl);
    });
};

export const sendWhatsAppBill = (phone: string, billNumber: string, pdfUrl: string) => {
    const message = `Hello! Here is your bill #${billNumber} from Family Grocery. You can view it here: ${pdfUrl}`;
    return sendWhatsAppMessage(phone, message);
};
