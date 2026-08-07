export class Order {
  constructor({ id, customerName, customerPhone, customerEmail, comments, items, subTotal, discountAmount, promoCodeApplied, totalAmount, status, createdAt }) {
    this.id = id || null;
    this.customerName = customerName;
    this.customerPhone = customerPhone;
    this.customerEmail = customerEmail || ''; 
    this.comments = comments || '';           
    this.items = items; 
    
    // NUEVO: Atrapamos los datos financieros y de marketing
    this.subTotal = Number(subTotal) || Number(totalAmount); 
    this.discountAmount = Number(discountAmount) || 0;
    this.promoCodeApplied = promoCodeApplied || '';

    this.totalAmount = Number(totalAmount);
    this.status = status || 'PENDING'; 
    this.createdAt = createdAt || new Date();
  }

  toFirestore() {
    return {
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail, 
      comments: this.comments,           
      items: this.items,
      subTotal: this.subTotal,                   // A Firebase
      discountAmount: this.discountAmount,       // A Firebase
      promoCodeApplied: this.promoCodeApplied,   // A Firebase
      totalAmount: this.totalAmount,
      status: this.status,
      createdAt: this.createdAt
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Order({
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date() 
    });
  }
}