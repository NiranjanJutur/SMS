
export type Language = 'en' | 'kn' | 'hi' | 'te' | 'mr';

export const TRANSLATIONS: Record<Language, any> = {
    en: {
        // Shared
        shopName: 'Sri Manjunatha Stores',
        caption: 'Smart Management System',
        back: 'Back',
        add: 'Add',
        save: 'Save',
        cancel: 'Cancel',
        loading: 'Loading...',

        // Login
        selectRole: 'Select your role to continue',
        selectLang: 'Select Language',
        roles: {
            OWNER: 'Owner',
            CASHIER: 'Cashier',
            STOCK_MANAGER: 'Stock Manager',
            ACCOUNTANT: 'Accountant',
        },

        // Tabs
        tabs: {
            home: 'Home',
            items: 'Items',
            billing: 'Billing',
            customers: 'Customers',
            dashboard: 'Dashboard',
            reports: 'Reports',
        },

        // Home
        greetings: {
            morning: 'Good Morning 🌅',
            afternoon: 'Good Afternoon ☀️',
            evening: 'Good Evening 🌙',
        },
        stats: {
            sales: "Today's Sales",
            bills: 'Bills Today',
            udhaar: 'Udhaar Due',
            stock: 'Low Stock',
        },
        actions: {
            title: 'Quick Actions',
            scan: 'Scan Item',
            slip: 'Process Slip',
            voice: 'Voice Add',
            bill: 'New Bill',
            customers: 'Customers',
            inventory: 'Inventory',
            addProduct: 'Add Product',
            dashboard: 'Dashboard',
            viewBills: 'View Bills',
        }
    },
    kn: {
        shopName: 'ಶ್ರೀ ಮಂಜುನಾಥ ಸ್ಟೋರ್ಸ್',
        caption: 'ಸ್ಮಾರ್ಟ್ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ',
        back: 'ಹಿಂದಕ್ಕೆ',
        add: 'ಸೇರಿಸಿ',
        save: 'ಉಳಿಸಿ',
        cancel: 'ರದ್ದುಮಾಡಿ',
        loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',

        selectRole: 'ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆರಿಸಿ',
        selectLang: 'ಭಾಷೆಯನ್ನು ಆರಿಸಿ',
        roles: {
            OWNER: 'ಮಾಲೀಕರು',
            CASHIER: 'ಕ್ಯಾಷಿಯರ್',
            STOCK_MANAGER: 'ಸ್ಟಾಕ್ ಮ್ಯಾನೇಜರ್',
            ACCOUNTANT: 'ಲೆಕ್ಕಿಗ',
        },

        tabs: {
            home: 'ಮುಖಪುಟ',
            items: 'ವಸ್ತುಗಳು',
            billing: 'ಬಿಲ್ಲಿಂಗ್',
            customers: 'ಗ್ರಾಹಕರು',
            dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
            reports: 'ವರದಿಗಳು',
        },

        greetings: {
            morning: 'ಶುಭ ಮುಂಜಾನೆ 🌅',
            afternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ ☀️',
            evening: 'ಶುಭ ಸಂಜೆ 🌙',
        },
        stats: {
            sales: 'ಇಂದಿನ ಮಾರಾಟ',
            bills: 'ಇಂದಿನ ಬಿಲ್‌ಗಳು',
            udhaar: 'ಬಾಕಿ (ಉದ್ರಿ)',
            stock: 'ಕಡಿಮೆ ದಾಸ್ತಾನು',
        },
        actions: {
            title: 'ತ್ವರಿತ ಕ್ರಮಗಳು',
            scan: 'ವಸ್ತುವನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
            slip: 'ಚೀಟಿ ಪ್ರಕ್ರಿಯೆ',
            voice: 'ಧ್ವನಿ ಮೂಲಕ ಸೇರಿಸಿ',
            bill: 'ಹೊಸ ಬಿಲ್',
            customers: 'ಗ್ರಾಹಕರು',
            inventory: 'ದಾಸ್ತಾನು',
            addProduct: 'ವಸ್ತು ಸೇರಿಸಿ',
            dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
            viewBills: 'ಬಿಲ್‌ಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
        }
    },
    hi: {
        shopName: 'श्री मंजुनाथ स्टोर्स',
        caption: 'स्मार्ट मैनेजमेंट सिस्टम',
        back: 'पीछे',
        add: 'जोड़ें',
        save: 'सहेजें',
        cancel: 'रद्द करें',
        loading: 'लोड हो रहा है...',

        selectRole: 'जारी रखने के लिए अपनी भूमिका चुनें',
        selectLang: 'भाषा चुनें',
        roles: {
            OWNER: 'मालिक',
            CASHIER: 'कैशियर',
            STOCK_MANAGER: 'स्टॉक मैनेजर',
            ACCOUNTANT: 'मुनीम',
        },

        tabs: {
            home: 'होम',
            items: 'आइटम',
            billing: 'बिलिंग',
            customers: 'ग्राहक',
            dashboard: 'डैशबोर्ड',
            reports: 'रिपोर्ट',
        },

        greetings: {
            morning: 'सुप्रभात 🌅',
            afternoon: 'नमस्ते ☀️',
            evening: 'शुभ संध्या 🌙',
        },
        stats: {
            sales: 'आज की बिक्री',
            bills: 'आज के बिल',
            udhaar: 'उधार राशि',
            stock: 'कम स्टॉक',
        },
        actions: {
            title: 'त्वरित कार्रवाई',
            scan: 'स्कैन करें',
            slip: 'पर्ची प्रोसेस',
            voice: 'वॉइस से जोड़ें',
            bill: 'नया बिल',
            customers: 'ग्राहक',
            inventory: 'इन्वेंट्री',
            addProduct: 'आइटम जोड़ें',
            dashboard: 'डैशबोर्ड',
            viewBills: 'बिल देखें',
        }
    },
    te: {
        shopName: 'శ్రీ మంజునాథ స్టోర్స్',
        caption: 'స్మార్ట్ మేనేజ్మెంట్ సిస్టమ్',
        back: 'వెనుకకు',
        add: 'జతచేయి',
        save: 'సేవ్ చేయి',
        cancel: 'రద్దు చేయి',
        loading: 'లోడ్ అవుతోంది...',

        selectRole: 'కొనసాగించడానికి మీ పాత్రను ఎంచుకోండి',
        selectLang: 'భాషను ఎంచుకోండి',
        roles: {
            OWNER: 'యజమాని',
            CASHIER: 'క్యాషియర్',
            STOCK_MANAGER: 'స్టాక్ మేనేజర్',
            ACCOUNTANT: 'అకౌంటెంట్',
        },

        tabs: {
            home: 'హోమ్',
            items: 'వస్తువులు',
            billing: 'బిల్లింగ్',
            customers: 'కస్టమర్లు',
            dashboard: 'డ్యాష్‌బోర్డ్',
            reports: 'నివేదికలు',
        },

        greetings: {
            morning: 'శుభోదయం 🌅',
            afternoon: 'శుభ మధ్యాహ్నం ☀️',
            evening: 'శుభ సాయంత్రం 🌙',
        },
        stats: {
            sales: 'నేటి అమ్మకాలు',
            bills: 'నేటి బిల్లులు',
            udhaar: 'బాకీ మొత్తం',
            stock: 'తక్కువ స్టాక్',
        },
        actions: {
            title: 'త్వరిత చర్యలు',
            scan: 'స్కాన్ చేయండి',
            slip: 'స్లిప్ ప్రాసెస్',
            voice: 'వాయిస్ యాడ్',
            bill: 'కొత్త బిల్లు',
            customers: 'కస్టమర్లు',
            inventory: 'ఇన్వెంటరీ',
            addProduct: 'వస్తువును చేర్చు',
            dashboard: 'డ్యాష్‌బోర్డ్',
            viewBills: 'బిల్లులు చూడు',
        }
    },
    mr: {
        shopName: 'श्री मंजुनाथ स्टोर्स',
        caption: 'स्मार्ट मॅनेजमेंट सिस्टम',
        back: 'मागे',
        add: 'जोडा',
        save: 'जतन करा',
        cancel: 'रद्द करा',
        loading: 'लोड होत आहे...',

        selectRole: 'पुढे जाण्यासाठी तुमची भूमिका निवडा',
        selectLang: 'भाषा निवडा',
        roles: {
            OWNER: 'मालक',
            CASHIER: 'कॅशियर',
            STOCK_MANAGER: 'स्टॉक मॅनेजर',
            ACCOUNTANT: 'अकाउंटंट',
        },

        tabs: {
            home: 'होम',
            items: 'वस्तू',
            billing: 'बिलिंग',
            customers: 'ग्राहक',
            dashboard: 'डॅशबोर्ड',
            reports: 'अहवाल',
        },

        greetings: {
            morning: 'सुप्रभात 🌅',
            afternoon: 'शुभ दुपार ☀️',
            evening: 'शुभ संध्याकाळ 🌙',
        },
        stats: {
            sales: 'आजची विक्री',
            bills: 'आजची बिले',
            udhaar: 'उधार बाकी',
            stock: 'कमी स्टॉक',
        },
        actions: {
            title: 'त्वरित कृती',
            scan: 'स्कॅन करा',
            slip: 'स्लिप प्रोसेस',
            voice: 'व्हॉइस ॲड',
            bill: 'नवीन बिल',
            customers: 'ग्राहक',
            inventory: 'इन्व्हेंटरी',
            addProduct: 'वस्तू जोडा',
            dashboard: 'डॅशबोर्ड',
            viewBills: 'बिले पहा',
        }
    }
};
