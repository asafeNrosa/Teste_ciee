import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CandidatoRequest, DadosExtraidos } from '../../core/models/candidato.model';
import { CandidatoService } from '../../core/services/candidato.service';
import { EMAIL_REGEX, TAMANHO_MAXIMO_PDF, obrigatorio } from '../../core/validacao';

type Campo = 'nomeCompleto' | 'email' | 'telefone' | 'areaInteresse' | 'resumoProfissional';

interface Mensagem {
  tipo: 'success' | 'danger' | 'warning' | 'info';
  texto: string;
}

@Component({
  selector: 'app-candidato-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './candidato-form.html',
  styleUrl: './candidato-form.scss'
})
export class CandidatoForm {
  private readonly fb = inject(FormBuilder);
  private readonly candidatoService = inject(CandidatoService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    nomeCompleto: ['', [obrigatorio, Validators.maxLength(150)]],
    email: ['', [obrigatorio, Validators.maxLength(254), Validators.pattern(EMAIL_REGEX)]],
    telefone: ['', Validators.maxLength(20)],
    areaInteresse: ['', Validators.maxLength(100)],
    resumoProfissional: ['', Validators.maxLength(2000)]
  });

  readonly lendoPdf = signal(false);
  readonly salvando = signal(false);
  readonly nomeArquivo = signal<string | null>(null);
  readonly mensagemPdf = signal<Mensagem | null>(null);
  readonly mensagemGeral = signal<Mensagem | null>(null);
  readonly camposDoPdf = signal(new Set<Campo>());

  aoSelecionarArquivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = ''; // permite selecionar o mesmo arquivo de novo
    if (!arquivo) return;

    this.nomeArquivo.set(arquivo.name);
    this.mensagemPdf.set(null);

    if (!arquivo.name.toLowerCase().endsWith('.pdf')) {
      this.mensagemPdf.set({ tipo: 'danger', texto: 'Formato inválido. Envie um arquivo PDF.' });
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_PDF) {
      this.mensagemPdf.set({ tipo: 'danger', texto: 'O arquivo excede o tamanho máximo de 5 MB.' });
      return;
    }

    this.lendoPdf.set(true);
    this.candidatoService.extrairDoPdf(arquivo)
      .pipe(finalize(() => this.lendoPdf.set(false)))
      .subscribe({
        next: dados => this.aplicarDadosExtraidos(dados),
        error: (erro: HttpErrorResponse) => this.mensagemPdf.set({
          tipo: 'danger',
          texto: `${this.mensagemDoErro(erro, 'Não foi possível ler o PDF.')} Você pode preencher os dados manualmente.`
        })
      });
  }

  salvar(): void {
    this.mensagemGeral.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensagemGeral.set({ tipo: 'danger', texto: 'Corrija os campos destacados antes de salvar.' });
      return;
    }

    const valores = this.form.getRawValue();
    const dados: CandidatoRequest = {
      nomeCompleto: valores.nomeCompleto.trim(),
      email: valores.email.trim(),
      telefone: valores.telefone.trim() || null,
      areaInteresse: valores.areaInteresse.trim() || null,
      resumoProfissional: valores.resumoProfissional.trim() || null
    };

    this.salvando.set(true);
    this.candidatoService.cadastrar(dados)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: candidato => this.router.navigate(['/candidatos', candidato.id], { state: { cadastroSalvo: true } }),
        error: (erro: HttpErrorResponse) => this.tratarErroCadastro(erro)
      });
  }

  erroDe(campo: Campo): string | null {
    const controle = this.form.controls[campo];
    if (!controle.touched || !controle.errors) return null;

    const erros = controle.errors;
    if (erros['required']) return campo === 'nomeCompleto' ? 'O nome completo é obrigatório.' : 'O e-mail é obrigatório.';
    if (erros['pattern']) return 'Informe um e-mail válido.';
    if (erros['maxlength']) return `Use no máximo ${erros['maxlength'].requiredLength} caracteres.`;
    if (erros['duplicado']) return 'Já existe um candidato cadastrado com este e-mail.';
    if (erros['servidor']) return erros['servidor'];
    return null;
  }

  removerDestaque(campo: Campo): void {
    if (!this.camposDoPdf().has(campo)) return;
    const restantes = new Set(this.camposDoPdf());
    restantes.delete(campo);
    this.camposDoPdf.set(restantes);
  }

  private aplicarDadosExtraidos(dados: DadosExtraidos): void {
    const encontrados = new Set<Campo>();
    const faltando: string[] = [];
    const campos: [Campo, string | null, string][] = [
      ['nomeCompleto', dados.nomeCompleto, 'nome'],
      ['email', dados.email, 'e-mail'],
      ['telefone', dados.telefone, 'telefone']
    ];

    for (const [campo, valor, rotulo] of campos) {
      if (valor) {
        const controle = this.form.controls[campo];
        controle.setValue(valor);
        controle.markAsTouched();
        encontrados.add(campo);
      } else {
        faltando.push(rotulo);
      }
    }

    this.camposDoPdf.set(encontrados);

    if (encontrados.size === 0) {
      this.mensagemPdf.set({ tipo: 'warning', texto: 'Não identificamos nome, e-mail nem telefone neste PDF. Preencha os dados manualmente.' });
    } else if (faltando.length > 0) {
      this.mensagemPdf.set({ tipo: 'warning', texto: `Dados importados do PDF. Não encontramos: ${faltando.join(', ')}. Preencha manualmente e confira os campos destacados.` });
    } else {
      this.mensagemPdf.set({ tipo: 'success', texto: 'Nome, e-mail e telefone importados do PDF. Confira os campos destacados antes de salvar.' });
    }
  }

  private tratarErroCadastro(erro: HttpErrorResponse): void {
    if (erro.status === 409) {
      const email = this.form.controls.email;
      email.setErrors({ duplicado: true });
      email.markAsTouched();
      this.mensagemGeral.set({ tipo: 'danger', texto: 'Já existe um candidato cadastrado com este e-mail.' });
      return;
    }

    const errosPorCampo = erro.error?.errors as Record<string, string[]> | undefined;
    if (erro.status === 400 && errosPorCampo) {
      for (const [chave, mensagens] of Object.entries(errosPorCampo)) {
        const controle = this.form.get(chave.charAt(0).toLowerCase() + chave.slice(1));
        controle?.setErrors({ servidor: mensagens[0] });
        controle?.markAsTouched();
      }
      this.mensagemGeral.set({ tipo: 'danger', texto: 'Corrija os campos destacados antes de salvar.' });
      return;
    }

    this.mensagemGeral.set({ tipo: 'danger', texto: this.mensagemDoErro(erro, 'Não foi possível salvar o cadastro.') });
  }

  private mensagemDoErro(erro: HttpErrorResponse, padrao: string): string {
    if (erro.status === 0) return 'Não foi possível conectar à API. Verifique se o backend está em execução.';
    if (erro.status === 413) return 'O arquivo excede o tamanho máximo permitido.';
    return erro.error?.title ?? padrao;
  }
}