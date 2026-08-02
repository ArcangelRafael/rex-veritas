export class Product {
  constructor({ id, name, brand, brands, size, price, stock, imageUrl, imageUrls, description, isActive, isBoosted }) {
    this.id = id || null;
    this.name = name;
    
    // Soportar múltiples marcas (colaboraciones)
    this.brands = Array.isArray(brands) ? brands : (brand ? [brand] : ['']);
    this.brand = this.brands.length > 0 ? this.brands[0] : ''; // Retrocompatibilidad para la tienda
    
    this.size = size;
    this.price = Number(price);
    this.stock = Number(stock);
    
    // Soportar múltiples imágenes
    this.imageUrls = Array.isArray(imageUrls) ? imageUrls : (imageUrl ? [imageUrl] : ['']);
    this.imageUrl = this.imageUrls.length > 0 ? this.imageUrls[0] : ''; // Retrocompatibilidad para la tienda
    
    this.description = description || '';
    this.isActive = isActive !== undefined ? isActive : true;
    
    // NUEVO: Campo para Boost de marketing
    this.isBoosted = isBoosted !== undefined ? isBoosted : false; 
  }

  hasSufficientStock(quantity) {
    return this.stock >= quantity;
  }

  toFirestore() {
    return {
      name: this.name,
      brand: this.brand, // Guardamos el principal
      brands: this.brands, // Guardamos la lista completa
      size: this.size,
      price: this.price,
      stock: this.stock,
      imageUrl: this.imageUrl, // Guardamos la principal
      imageUrls: this.imageUrls, // Guardamos la lista completa
      description: this.description,
      isActive: this.isActive,
      isBoosted: this.isBoosted, // Guardamos el estado del Boost
      updatedAt: new Date()
    };
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Product({
      id: doc.id,
      ...data
    });
  }
}