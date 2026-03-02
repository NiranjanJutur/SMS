# Sri Manjunatha Stores (SMS) 🏪
### Smart Retail & Inventory Management System

> **Kannada:** ಶ್ರೀ ಮಂಜುನಾಥ ಸ್ಟೋರ್ಸ್ (SMS) — ಸ್ಮಾರ್ಟ್ ಚಿಲ್ಲರೆ ಮತ್ತು ದಾಸ್ತಾನು ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ
>
> **Hindi:** श्री मंजುनाथ स्टोर्स (SMS) — स्मार्ट रिटेल और इन्ವೆंट्री मैनेजमेंट सिस्टम

---

## 🚀 Overview
**SMS (Sri Manjunatha Stores)** is a modern, voice-enabled Point of Sale (POS) and Inventory Management web application designed specifically for retail store owners. It simplifies daily billing, tracks credit (Udhaar), manages stock with multi-unit support, and provides deep insights into sales.

Whether you are a **Cashier** looking for fast billing, a **Stock Manager** tracking boxes and cartons, or an **Owner** reviewing business performance, SMS provides a seamless experience.

---

## ✨ Key Features

### 🎙️ Voice-First Billing
Add products to the bill just by speaking! Commands like *"Add 2 kg Basmati Rice"* or *"Add 5 boxes of Parle-G"* are automatically parsed and added to the cart instantly.

### 🏷️ Flexible Discounting & Notes
*   **Item-Level Discounts:** Long-press any item to apply a flat ₹ discount or a % off.
*   **Item Notes:** Add specific reminders for products (e.g., "sugar-free", "extra packing").
*   **Bill-Level Discounts:** Apply a final discount to the entire bill total before checkout.

### 📦 Smart Multi-Unit Inventory
Support for complex retail units used in India:
*   **Weight:** kg, g, gm
*   **Volume:** ltr, ml, can, tin
*   **Containers:** Box, Carton, Bag, Packet
*   **Pack Sizes:** Set a "Pack Size" once in the inventory (e.g., 1 Box = 12 Pieces). During billing, just enter the number of boxes, and SMS handles the math automatically.

### 📓 Udhaar & Customer Management
*   Track outstanding balances for regular customers.
*   Set credit limits per customer type (VIP, Small Retailer, etc.).
*   Easy checkout using UPI, Cash, or **Udhaar**.

### 📊 Role-Based Access
*   **Owner:** Full control over products, staff, and financial reports.
*   **Cashier:** Focused on fast billing and customer service.
*   **Stock Manager:** Managing arrivals, low-stock alerts, and threshold management.
*   **Accountant:** Detailed sales analytics and tax (GST) reports.

---

## 🛠️ Tech Stack
- **Frontend:** React with TypeScript
- **Styling:** Custom CSS based on a premium Design System (Theme.ts)
- **State Management:** Custom Hooks (`useCart`, `useUdhaar`, `useVoice`)
- **Backend:** Firebase (Firestore) for real-time data sync
- **Build Tool:** Vite

---

## 🏗️ Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
1.  **Clone the Repository:**
    ```sh
    git clone https://github.com/NiranjanJutur/SMS.git
    cd SMS
    ```

2.  **Install Dependencies:**
    ```sh
    npm install
    ```

3.  **Run Locally (Web):**
    ```sh
    npm run web:dev
    ```
    The app will be available at `http://localhost:5173`.

---

## 🧹 Project Structure
*   `src/screens/` - Role-specific dashboards and feature pages.
*   `src/components/` - Reusable UI components (Modals, Buttons, Inputs).
*   `src/hooks/` - Core logic for Cart, Voice, and Credit management.
*   `src/services/` - Firebase and Local data interaction layers.
*   `src/utils/` - Unit conversion, currency formatting, and billing math.

---

## ⚖️ License
This project is private and intended for use by **Sri Manjunatha Stores**. 
Owner: **Niranjan Jutur**

---
*Built with ❤️ for better retail management.*
