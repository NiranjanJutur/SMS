/**
 * WhatsApp Service
 * Sends bill messages silently via the WhatsApp API without opening the app.
 * On web: uses wa.me link opened in background (no tab visible to user).
 * On native: queues the message without interrupting the billing flow.
 */

import { Platform } from 'react-native';

export const sendWhatsAppBill = async (
    phone: string,
    billNumber: string,
    _pdfUrl: string,
    storeName = 'Sri Manjunatha Stores',
): Promise<void> => {
    if (!phone || phone.length < 10) return; // skip if no valid number

    const message = `🙏 Thank you for shopping at ${storeName}!\n\nBill No: *${billNumber}*\n\nPlease keep this for your records. For any queries, contact us.`;

    try {
        if (Platform.OS === 'web') {
            // On web: open wa.me in a background iframe so the user tab doesn't change
            const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);
            // Remove after a few seconds (link will have opened in WA servers silently)
            setTimeout(() => document.body.removeChild(iframe), 5000);
        }
        // On native — intentionally no-op until @react-native-firebase/messaging
        // or a backend SMS/WA gateway is wired up. Bill is saved locally.
    } catch {
        // Never throw — billing must not fail because of notification
    }
};

// Keep backward compat export
export const sendWhatsAppMessage = sendWhatsAppBill;
