export interface Candidato {
  id: number;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  areaInteresse: string | null;
  resumoProfissional: string | null;
  dataCadastro: string;
}

export interface CandidatoRequest {
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  areaInteresse: string | null;
  resumoProfissional: string | null;
}

export interface DadosExtraidos {
  nomeCompleto: string | null;
  email: string | null;
  telefone: string | null;
}