import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let modeloIA = null;
let carregando = false;
const filaEspera = [];

export const PALAVRAS_CHAVE_IA = {
  refeicao: ['sandwich', 'pizza', 'cake', 'donut', 'carrot', 'broccoli', 'apple', 'orange', 'banana', 'hot dog', 'bowl', 'food', 'dining table'],
  exercicio: ['person', 'sports ball', 'skateboard', 'surfboard', 'snowboard', 'frisbee', 'baseball bat', 'baseball glove', 'tennis racket', 'gym', 'weight'],
  selfie: ['person', 'face', 'head', 'hair', 'eyes', 'mouth'],
  prato_feito: ['sandwich', 'pizza', 'bowl', 'cake', 'donut', 'hot dog', 'carrot', 'broccoli', 'plate', 'dining table'],
  agua: ['bottle', 'cup', 'glass', 'water', 'drink'],
  fruta: ['apple', 'orange', 'banana', 'carrot', 'fruit'],
  amigo: ['person', 'face', 'head', 'hair', 'people', 'group']
};

export async function carregarModeloIA(onProgress) {
  if (modeloIA) {
    if (onProgress) onProgress(100, 'Modelo já carregado!');
    return modeloIA;
  }

  if (carregando) {
    return new Promise((resolve) => {
      filaEspera.push(resolve);
    });
  }

  carregando = true;
  try {
    if (onProgress) onProgress(20, 'Carregando modelo...');
    modeloIA = await cocoSsd.load();
    if (onProgress) onProgress(100, 'IA carregada!');
    filaEspera.forEach(cb => cb(modeloIA));
    filaEspera.length = 0;
    return modeloIA;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    carregando = false;
  }
}

export function isModeloCarregado() {
  return modeloIA !== null;
}

export async function analisarImagemComIA(imagemDataUrl, categoria) {
  if (!modeloIA) await carregarModeloIA();

  const img = new Image();
  img.src = imagemDataUrl;
  await new Promise((resolve) => { img.onload = resolve; });

  const predictions = await modeloIA.detect(img);
  return processarAnalise(predictions, categoria);
}

function processarAnalise(predictions, categoria) {
  const palavras = PALAVRAS_CHAVE_IA[categoria] || PALAVRAS_CHAVE_IA.refeicao;
  let pontuacao = 0;
  const objetosMatch = [];
  let totalPessoas = 0;

  if (categoria === 'amigo') {
    totalPessoas = predictions.filter(p => p.class.toLowerCase().includes('person')).length;
  }

  for (const pred of predictions) {
    const classe = pred.class.toLowerCase();
    if (palavras.some(p => classe.includes(p))) {
      pontuacao += pred.score;
      objetosMatch.push(pred.class);
    }
  }

  if (categoria === 'amigo') {
    if (totalPessoas >= 2) return { aprovado: true, confianca: 0.9, objetosEncontrados: [...new Set(objetosMatch)], mensagem: '🎉 Foto com amigo!' };
    else return { aprovado: false, confianca: 0, mensagem: 'Precisa de pelo menos 2 pessoas.' };
  }

  if (pontuacao >= 0.7) return { aprovado: true, confianca: pontuacao, objetosEncontrados: [...new Set(objetosMatch)], mensagem: 'Boa! Foto reconhecida.' };
  else return { aprovado: false, confianca: pontuacao, objetosEncontrados: [...new Set(objetosMatch)], mensagem: 'Baixa confiança.' };
}