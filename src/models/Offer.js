export class Offer {
  constructor({ id, type, title, description, isActive, startDate, endDate, conditions, discount, promoCode, hideBanner, maxUses, currentUses, bannerPosition }) {
    this.id = id || null;
    this.type = type || 'PROMO_CODE'; 
    this.title = title || '';
    this.description = description || '';
    this.isActive = isActive !== undefined ? isActive : true;
    this.startDate = startDate || new Date().toISOString();
    this.endDate = endDate || ''; 
    this.hideBanner = hideBanner !== undefined ? hideBanner : false;
    
    this.maxUses = maxUses !== undefined ? maxUses : null; 
    this.currentUses = currentUses || 0;

    this.bannerPosition = bannerPosition || 1;
    
    // NUEVO: Agregamos targetQuality a las condiciones
    this.conditions = conditions || {
      minQuantity: 0,
      minSubtotal: 0,
      targetCategory: 'ALL',
      targetBrand: 'ALL',
      targetQuality: 'ALL', 
      productIds: [] 
    };

    this.discount = discount || {
      type: 'PERCENTAGE', 
      value: 0
    };

    this.promoCode = promoCode ? promoCode.trim().toUpperCase() : '';
  }

  isValid() {
    if (!this.isActive) return false;
    const now = new Date();
    if (new Date(this.startDate) > now) return false; 
    if (this.endDate && new Date(this.endDate) < now) return false; 
    if (this.maxUses !== null && this.currentUses >= this.maxUses) return false; 
    return true;
  }

  toFirestore() {
    return {
      type: this.type,
      title: this.title,
      description: this.description,
      isActive: this.isActive,
      startDate: this.startDate,
      endDate: this.endDate,
      hideBanner: this.hideBanner,
      maxUses: this.maxUses,
      currentUses: this.currentUses,
      bannerPosition: this.bannerPosition, 
      conditions: this.conditions,
      discount: this.discount,
      promoCode: this.promoCode,
      updatedAt: new Date()
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Offer({ id: doc.id, ...data });
  }
}