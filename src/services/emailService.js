import emailjs from '@emailjs/browser';

export const emailService = {
  sendOrderNotification: async (orderData) => {
    try {
      // Revisa que NO haya espacios en blanco al inicio o al final de estos textos
      const serviceID = 'service_knfkoqn'; 
      const templateID = 'template_hjjqp9f'; 
      const publicKey = 'jmr6FnIutKsWGIwy4'; 

      // Añadimos las dos nuevas variables para la plantilla
      const templateParams = {
        order_id: orderData.id,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail, // NUEVO
        comments: orderData.comments,            // NUEVO
        order_items: orderData.itemsDetails,
        total_amount: orderData.totalAmount
      };

      const response = await emailjs.send(serviceID, templateID, templateParams, publicKey);
      return response;
    } catch (error) {
      console.error("Error al enviar el correo:", error);
      throw error;
    }
  }
};