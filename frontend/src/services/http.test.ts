import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, MENSAGEM_API_INDISPONIVEL, comQuery, request } from './http';

function respostaTexto(corpo: string | null, status: number) {
  return Promise.resolve(new Response(corpo, { status }));
}

async function capturar(promessa: Promise<unknown>): Promise<ApiError> {
  try {
    await promessa;
  } catch (erro) {
    return erro as ApiError;
  }
  throw new Error('Era esperado um erro.');
}

afterEach(() => vi.unstubAllGlobals());

describe('comQuery', () => {
  it('ignora parâmetros vazios e codifica os demais', () => {
    expect(comQuery('/api/Veiculos', { placa: ' abc ', modelo: '', fabricanteId: undefined, disponivel: 'true' })).toBe(
      '/api/Veiculos?placa=abc&disponivel=true',
    );
    expect(comQuery('/api/Clientes', {})).toBe('/api/Clientes');
    expect(comQuery('/api/Clientes')).toBe('/api/Clientes');
    expect(comQuery('/api/Fabricantes', { nome: 'São Paulo & Cia' })).toBe('/api/Fabricantes?nome=S%C3%A3o+Paulo+%26+Cia');
  });
});

describe('request', () => {
  it('devolve o JSON em respostas 200 e 201', async () => {
    vi.stubGlobal('fetch', () => respostaTexto('{"id":1,"nome":"Fiat"}', 201));
    await expect(request('/api/Fabricantes', { method: 'POST', body: { nome: 'Fiat' } })).resolves.toEqual({ id: 1, nome: 'Fiat' });
  });

  it('devolve undefined em respostas 204', async () => {
    vi.stubGlobal('fetch', () => respostaTexto(null, 204));
    await expect(request('/api/Fabricantes/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('envia o corpo como JSON com o método informado', async () => {
    const falso = vi.fn(() => respostaTexto(null, 204));
    vi.stubGlobal('fetch', falso);
    await request('/api/Fabricantes/1', { method: 'PUT', body: { nome: 'Fiat' } });
    const [url, init] = falso.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/Fabricantes/1');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe('{"nome":"Fiat"}');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('converte 400 de validação do ASP.NET Core em erros por campo (chaves em camelCase)', async () => {
    const corpo = { title: 'One or more validation errors occurred.', status: 400, errors: { Nome: ['O nome do fabricante é obrigatório.'], '$.dataInicio': ['JSON inválido'] } };
    vi.stubGlobal('fetch', () => respostaTexto(JSON.stringify(corpo), 400));
    const erro = await capturar(request('/api/Fabricantes', { method: 'POST', body: {} }));
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(400);
    expect(erro.fieldErrors).toEqual({ nome: 'O nome do fabricante é obrigatório.', dataInicio: 'JSON inválido' });
    expect(erro.message).toContain('O nome do fabricante é obrigatório.');
  });

  it.each([
    [400, 'O cliente informado não existe.'],
    [404, 'Fabricante não encontrado.'],
    [409, 'Já existe um fabricante com este nome.'],
    [500, 'Ocorreu um erro inesperado ao processar a requisição.'],
  ])('usa a mensagem da API em respostas %i', async (status, mensagem) => {
    vi.stubGlobal('fetch', () => respostaTexto(JSON.stringify({ mensagem }), status));
    const erro = await capturar(request('/api/qualquer'));
    expect(erro.status).toBe(status);
    expect(erro.message).toBe(mensagem);
  });

  it('usa mensagens padrão quando a resposta de erro não traz corpo útil', async () => {
    vi.stubGlobal('fetch', () => respostaTexto('{}', 404));
    expect((await capturar(request('/api/x'))).message).toBe('O registro solicitado não foi encontrado.');
    vi.stubGlobal('fetch', () => respostaTexto('{}', 409));
    expect((await capturar(request('/api/x'))).message).toContain('conflito');
  });

  it('trata erro 5xx sem corpo (proxy sem API) como API indisponível', async () => {
    vi.stubGlobal('fetch', () => respostaTexto('', 500));
    const erro = await capturar(request('/api/Fabricantes'));
    expect(erro.kind).toBe('rede');
    expect(erro.message).toBe(MENSAGEM_API_INDISPONIVEL);
  });

  it('trata falha de rede como API indisponível', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
    const erro = await capturar(request('/api/Fabricantes'));
    expect(erro.kind).toBe('rede');
    expect(erro.status).toBe(0);
    expect(erro.message).toBe(MENSAGEM_API_INDISPONIVEL);
  });

  it('trata JSON inválido em resposta de sucesso', async () => {
    vi.stubGlobal('fetch', () => respostaTexto('<html>não é json</html>', 200));
    const erro = await capturar(request('/api/Fabricantes'));
    expect(erro.kind).toBe('resposta-invalida');
    expect(erro.message).toContain('resposta inválida');
  });

  it('repassa o cancelamento da requisição sem convertê-lo', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new DOMException('abortado', 'AbortError')));
    await expect(request('/api/Fabricantes')).rejects.toMatchObject({ name: 'AbortError' });
  });
});
