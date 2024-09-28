const apiKey = 'op_J_anEWNnPNdRshb';  // Chave API do OpenPoll
const spreadsheetId = '1BCJo1ek8RLJSVF7qoK1sKGmpSvY3XsNyeXkcKBqm7xc';
const sheetName = 'distribuicao';
const apiURL = 'https://openpoll.api';

const options = {
    headers: {
        Authorization: `Bearer ${apiKey}`,
    },
};

// Função para criar uma nova enquete
function criarEnquete(titulo, candidatos) {
    const payload = {
        titulo: titulo,
        candidatos: candidatos,
    };

    const requestOptions = {
        ...options,
        method: 'post',
        payload: JSON.stringify(payload),
    };

    const response = UrlFetchApp.fetch(`${apiURL}/poll/create`, requestOptions);
    return JSON.parse(response.getContentText());
}

// Função para registrar uma nova enquete
function registrarEnquete(titulo, link, candidatos) {
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    sheet.appendRow([titulo, link, ...candidatos]);
}

// Função para obter dados de uma enquete
function obterDadosEnquete(titulo) {
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();

    for (let i = 0; i < data.length; i++) {
        if (data[i][0] === titulo) {
            return {
                link: data[i][1],
                candidatos: data[i].slice(2),
            };
        }
    }
    return null;
}

// Função para obter votos de uma enquete
function obterVotos(pollId) {
    const requestOptions = {
        ...options,
        method: 'get',
    };

    const response = UrlFetchApp.fetch(`${apiURL}/poll/${pollId}/results`, requestOptions);
    const jsonResponse = JSON.parse(response.getContentText());
    return jsonResponse.results.map(result => result.option);
}

// Função para calcular o total de votos
function calcularTotais(votos, candidatos) {
    const totais = candidatos.reduce((acc, candidato) => {
        acc[candidato] = 0;
        return acc;
    }, {});

    votos.forEach(voto => {
        if (voto.length > 0) {
            totais[voto[0]]++;
        }
    });

    return totais;
}

// Função para redistribuir os votos para o método STV
function redistribuirVotos(votos, eliminado) {
    return votos.map(voto => voto.filter(candidato => candidato !== eliminado));
}

// Função de apuração por STV
function apuracaoSTV(votos, numVencedores) {
    let candidatos = [...new Set(votos.flat())];
    let vencedores = [];
    let rodada = 1;

    while (vencedores.length < numVencedores && candidatos.length > 0) {
        console.log(`\nRodada ${rodada}:`);
        const totais = calcularTotais(votos, candidatos);

        const menosVotado = Object.keys(totais).reduce((a, b) => totais[a] < totais[b] ? a : b);
        console.log(`Candidato menos votado na rodada ${rodada}: ${menosVotado}`);

        candidatos = candidatos.filter(candidato => candidato !== menosVotado);
        votos = redistribuirVotos(votos, menosVotado);
        rodada++;
    }

    return vencedores;
}