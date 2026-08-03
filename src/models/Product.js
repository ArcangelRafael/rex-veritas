export class Product {
  constructor({ id, name, brand, brands, size, price, stock, imageUrl, imageUrls, description, isActive, isBoosted, category, quality, releaseDate }) {
    this.id = id || null;
    this.name = name;
    
    this.brands = Array.isArray(brands) ? brands : (brand ? [brand] : ['']);
    this.brand = this.brands.length > 0 ? this.brands[0] : ''; 
    
    this.size = size;
    this.price = Number(price);
    this.stock = Number(stock);
    
    this.imageUrls = Array.isArray(imageUrls) ? imageUrls : (imageUrl ? [imageUrl] : ['']);
    this.imageUrl = this.imageUrls.length > 0 ? this.imageUrls[0] : ''; 
    
    this.description = description || '';
    this.isActive = isActive !== undefined ? isActive : true;
    this.isBoosted = isBoosted !== undefined ? isBoosted : false; 
    
    this.category = category || 'Gorra';
    this.quality = quality || 'N/A';
    
    // Campo para fecha de lanzamiento programada (ISO String)
    this.releaseDate = releaseDate || new Date().toISOString();
  }

  hasSufficientStock(quantity) {
    return this.stock >= quantity;
  }

  toFirestore() {
    return {
      name: this.name,
      brand: this.brand, 
      brands: this.brands, 
      size: this.size,
      price: this.price,
      stock: this.stock,
      imageUrl: this.imageUrl, 
      imageUrls: this.imageUrls, 
      description: this.description,
      isActive: this.isActive,
      isBoosted: this.isBoosted, 
      category: this.category,
      quality: this.quality,
      releaseDate: this.releaseDate,
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