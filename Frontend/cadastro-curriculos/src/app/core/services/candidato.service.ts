import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Candidato, CandidatoRequest, DadosExtraidos } from '../models/candidato.model';

@Injectable({ providedIn: 'root' })
export class CandidatoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listar(): Observable<Candidato[]> {
    return this.http.get<Candidato[]>(`${this.apiUrl}/candidatos`);
  }

  obterPorId(id: number): Observable<Candidato> {
    return this.http.get<Candidato>(`${this.apiUrl}/candidatos/${id}`);
  }

  cadastrar(dados: CandidatoRequest): Observable<Candidato> {
    return this.http.post<Candidato>(`${this.apiUrl}/candidatos`, dados);
  }

  extrairDoPdf(arquivo: File): Observable<DadosExtraidos> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return this.http.post<DadosExtraidos>(`${this.apiUrl}/curriculos/extrair`, formData);
  }
}