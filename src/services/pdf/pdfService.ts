export const generateGSTBillPDF = async (billData: any) => {
    // Mock PDF generation
    console.log('Generating PDF for Bill:', billData.billNo);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`https://storage.firebase.com/bills/${billData.billNo}.pdf`);
        }, 1000);
    });
};
