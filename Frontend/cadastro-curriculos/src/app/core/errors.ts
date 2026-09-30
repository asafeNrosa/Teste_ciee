import { HttpErrorResponse } from '@angular/common/http';

export function mensagemDeErro(erro: HttpErrorResponse, padrao: string): string {
  if (erro.status === 0) return 'Não foi possível conectar à API. Verifique se o backend está em execução.';
  if (erro.status === 413) return 'O arquivo excede o tamanho máximo permitido.';
  return erro.error?.title ?? padrao;
}