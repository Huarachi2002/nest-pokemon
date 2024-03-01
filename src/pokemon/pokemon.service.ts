import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ){}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      console.log(error);
      if(error.code === 11000){
        throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`);
      }
      throw new InternalServerErrorException(`Can't create pokemon - check server logs`)
    }

  }

  findAll() {
    return this.pokemonModel.find();
  }

  async findOne(id: string) {
    let pokemon:Pokemon;
    if(!isNaN(+id)){
      pokemon = await this.pokemonModel.findOne({ no: id })
    }
    // MongoID
    if(!pokemon && isValidObjectId(id)){
      pokemon = await this.pokemonModel.findById(id);
    }
    // Name
    if(!pokemon){
      pokemon = await this.pokemonModel.findOne({ name:id })
    }

    if(!pokemon) throw new NotFoundException(`Pokemon with id, name or no "${id} not found"`)
    
    return pokemon;
  }

  async update(id: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemonDB =  await this.findOne(id);

    try {
      if(updatePokemonDto.name) updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
      
      await pokemonDB.updateOne(updatePokemonDto);
  
      return {...pokemonDB.toJSON(), ...updatePokemonDto};
      
    } catch (error) {
      if(error.code === 11000){
        throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`);
      }
      console.log(error)
      throw new InternalServerErrorException(`Can't create pokemon - check server logs`)
    }

  }

  async remove(id: string) {
    const {deletedCount} = await this.pokemonModel.deleteOne({ _id: id});
    if(deletedCount === 0) throw new BadRequestException(`Pokemon with id "${id}" not found`)
    return;
  }
}
