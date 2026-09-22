import { Injectable } from '@angular/core';
import { Category } from '../models/category.model';
import { Movement } from '../models/movement.model';

interface KeywordMap {
  [categoryName: string]: string[];
}

const KEYWORD_MAP: KeywordMap = {
  'Alimentacion': [
    'supermercado', 'mercadona', 'lidl', 'carrefour', 'dia', 'alimentacion',
    'comida', 'restaurante', 'burger', 'mcdonald', 'telepizza', 'dominos',
    'uber eats', 'glovo', 'just eat', 'deliveroo', 'panaderia', 'carniceria',
    'pescaderia', 'fruteria', 'hipermercado', 'eroski', 'alcampo', 'consum',
    'bonarea', 'condis', 'caprabo', 'ahorramas', 'froiz'
  ],
  'Transporte': [
    'gasolina', 'gasolinera', 'uber', 'taxi', 'metro', 'bus', 'renfe',
    'parking', 'peaje', 'autopista', 'cercanias', 'ave', 'blablacar',
    'cabify', 'bolt', 'repsol', 'cepsa', 'bp', 'shell', 'galp',
    'tarjeta transporte', 'movilidad', 'vtm'
  ],
  'Ocio': [
    'netflix', 'spotify', 'cine', 'teatro', 'concierto', 'amazon',
    'steam', 'playstation', 'xbox', 'nintendo', 'disney', 'hbo',
    'amazon prime', 'youtube premium', 'apple music', 'tidal',
    'spotify', 'fnac', 'mediamarkt', 'game', 'entradas'
  ],
  'Servicios': [
    'telefono', 'movistar', 'vodafone', 'orange', 'internet', 'luz',
    'gas', 'agua', 'electricidad', 'endesa', 'iberdrola', 'naturgy',
    'canal de isabel', 'telefonica', 'jazztel', 'masmovil', 'yoigo',
    'fibra', 'adsl', 'factura', 'recibo', 'domiciliacion'
  ],
  'Salud': [
    'farmacia', 'hospital', 'medico', 'dentista', 'seguro medico',
    'clinica', 'laboratorio', 'analisis', 'radiografia', 'consulta',
    'especialista', 'oftalmologo', 'dermatologo', 'cardiologo',
    'ambulatorio', 'urgencias', 'receta', 'medicamento'
  ],
  'Ropa': [
    'zara', 'h&m', 'nike', 'adidas', 'mango', 'pull&bear', 'bershka',
    'stradivarius', 'massimo dutti', 'primark', 'decathlon', 'el corte ingles',
    'lefties', 'springfield', 'oysho', 'uterque', 'cos', 'uniqlo'
  ],
  'Hogar': [
    'ikea', 'leroy merlin', 'bricomart', 'ferreteria', 'alia',
    'conforama', 'muebles', 'decoracion', 'bricodepot', 'akı',
    'bauhaus', 'fontaneria', 'electricidad', 'pintura'
  ],
  'Nomina': [
    'nomina', 'salario', 'sueldo', 'transferencia', 'pago',
    'abono', 'devolucion', 'reembolso', 'nomina', 'sepe',
    'desempleo', 'pension', 'prestacion', 'subsidio'
  ],
  'Alquiler': [
    'alquiler', 'renta', 'hipoteca', 'inquilino', 'propietario',
    'comunidad', 'ibi', 'basuras', 'vivienda'
  ],
  'Educacion': [
    'universidad', 'colegio', 'instituto', 'academia', 'curso',
    'matricula', 'libros', 'material', 'formacion', 'master',
    'posgrado', 'idiomas', 'ingles', 'frances'
  ]
};

@Injectable({ providedIn: 'root' })
export class CategoryPredictionService {

  predictCategory(concepto: string, categories: Category[]): string | null {
    const conceptLower = concepto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const [catName, keywords] of Object.entries(KEYWORD_MAP)) {
      for (const keyword of keywords) {
        const kwNormalized = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (conceptLower.includes(kwNormalized)) {
          const matchedCat = categories.find(c =>
            c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
            catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          );
          if (matchedCat?.id) return matchedCat.id;
        }
      }
    }

    return null;
  }

  bulkPredict(movements: Partial<Movement>[], categories: Category[]): Partial<Movement>[] {
    return movements.map(m => {
      if (m.categoria_id || !m.concepto) return m;
      const predicted = this.predictCategory(m.concepto, categories);
      return predicted ? { ...m, categoria_id: predicted } : m;
    });
  }
}
