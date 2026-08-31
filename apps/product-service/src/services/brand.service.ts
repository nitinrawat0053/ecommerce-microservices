import { ConflictError, NotFoundError } from "@packages/errors";
import { BrandRepository } from "../repositories/brand.repository";

const brandRepository = new BrandRepository();

export class BrandService {
  async createBrand(name: string, description?: string, logo?: string) {
    const existing = await brandRepository.findByName(name);
    if (existing) {
      throw new ConflictError(`Brand "${name.trim()}" already exists`);
    }

    return await brandRepository.create({
      name: name.trim().toLowerCase(),
      description,
      logo,
    });
  }

  async getAllBrands() {
    return await brandRepository.findAll();
  }

  async getBrandById(brandId: string) {
    const brand = await brandRepository.findById(brandId);
    if (!brand) {
      throw new NotFoundError("Brand not found");
    }
    return brand;
  }

  async updateBrand(brandId: string, data: any) {
    const exists = await brandRepository.findById(brandId);
    if (!exists) {
      throw new NotFoundError("Brand not found");
    }

    if (data.name) {
      const duplicate = await brandRepository.findByName(data.name);
      if (duplicate && duplicate._id.toString() !== brandId) {
        throw new ConflictError(`Brand "${data.name.trim()}" already exists`);
      }
      data.name = data.name.trim().toLowerCase();
    }

    return await brandRepository.update(brandId, data);
  }

  async deleteBrand(brandId: string) {
    const brand = await brandRepository.delete(brandId);
    if (!brand) {
      throw new NotFoundError("Brand not found");
    }
    return brand;
  }
}
