const Web3 = require('web3');
const contractABI = require('./STVPollABI.json');  // ABI do contrato STVPoll
const contractAddress = '0x1234...';  // Endereço do contrato STVPoll implantado

const web3 = new Web3('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');  // Conexão com a Mainnet da Ethereum

async function submitVote(voterAddress, voteProof, preferences) {
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    const { a, b, c, input } = voteProof;

    const tx = contract.methods.castVote(a, b, c, input, preferences);

    const gas = await tx.estimateGas({ from: voterAddress });
    const gasPrice = await web3.eth.getGasPrice();

    const txData = {
        from: voterAddress,
        to: contractAddress,
        data: tx.encodeABI(),
        gas,
        gasPrice,
    };

    const signedTx = await web3.eth.accounts.signTransaction(txData, 'YOUR_PRIVATE_KEY');
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log('Vote submitted:', receipt.transactionHash);
}