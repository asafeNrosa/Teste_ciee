import { Component, OnInit, inject, input, numberAttribute, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { mensagemDeErro } from '../../core/errors';
import { Candidato } from '../../core/models/candidato.model';
import { CandidatoService } from '../../core/services/candidato.service';

@Component({
  selector: 'app-candidato-detalhe',
  imports: [RouterLink, DatePipe],
  templateUrl: './candidato-detalhe.html',
  styleUrl: './candidato-detalhe.scss'
})
export class CandidatoDetalhe implements OnInit {
  private readonly candidatoService = inject(CandidatoService);

  // Recebe o :id da rota (withComponentInputBinding) já convertido para número
  readonly id = input.required({ transform: numberAttribute });

  readonly candidato = signal<Candidato | null>(null);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly cadastroSalvo = history.state?.cadastroSalvo === true;

  ngOnInit(): void {
    if (!Number.isInteger(this.id())) {
      this.erro.set('Candidato não encontrado.');
      this.carregando.set(false);
      return;
    }

    this.candidatoService.obterPorId(this.id())
      .pipe(finalize(() => this.carregando.set(false)))
      .subscribe({
        next: candidato => this.candidato.set(candidato),
        error: (erro: HttpErrorResponse) =>
          this.erro.set(mensagemDeErro(erro, 'Não foi possível carregar o candidato.'))
      });
  }
}