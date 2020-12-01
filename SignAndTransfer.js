const axios = require('axios');
const EthereumTx = require('ethereumjs-tx').Transaction;
const prompt = require('prompt-sync')();
const Web3 = require('web3');

// Создаем проект на INFURA
// И устанавливаем соединение в тестовой сети, указав ссылку на созданный проект
const ethNetwork = 'https://rinkeby.infura.io/v3/d9de371c7d034cf49143cc1aee3aa97c';
const web3 = new Web3(new Web3.providers.HttpProvider(ethNetwork));

const amountToSend = +prompt('Введите количество ETH для перевода: ');
const receiverAddress = prompt('Введите адрес получателя: ');

// "Зашитые" публичный и приватный ключи
const myAddress = '0x277071ADA51DF484D2f87Ee02D559453A39ae5ca';
const key = '0x676bb5081c4fc416bb690fc694ee1608a828d706abe2b49c755c0157afabab77';

const unit = 'ether';

// Указываем, что будем работать в тестовой сети и задаем её ID
const chain = 'rinkeby';
const chainID = 4;

const gasLimit = 21000;

async function signAndTransfer(sendersData, receiverData) {
    return new Promise(async (resolve, reject) => {
        const nonce = await web3.eth.getTransactionCount(sendersData.address);

        await web3.eth.getBalance(sendersData.address, async (err, result) => {
            if (err) {
                return reject();
            }

            // Проверяем баланс - не больше ли значение, которое хотим отправить, количества ETH на балансе
            if (!(await checkBalance(result))) {
                return reject();
            }

            // Получаем текущие цены на газ,
            const gasPrices = await getCurrentGasPrices();

            // Подготавливаем тело транзации и выводим результат до подписания
            const transactionBody = await createTransactionBody(receiverData.address, nonce, gasPrices);
            console.log('\n\nTransaction body until it signed: ', transactionBody, '\n\n');

            // Подписываем транзакцию и выводим результат
            const transaction = await signTransaction(transactionBody, sendersData.privateKey);
            console.log('\n\nSigned transaction:\n', transaction.toJSON(),'\n\n')

            //Сериализуем транзакцию и выполняем перевод по введенному адресу
            //const serializedTransaction = transaction.serialize();
            //await transfer(reject, resolve, serializedTransaction.toString('hex'));
        });
    });
}

async function signTransaction(details, privateKey) {
    const transaction = new EthereumTx(details, {chain: chain});
    let privateKeyBytes = Buffer.from((privateKey.split('0x'))[1], 'hex');
    transaction.sign(privateKeyBytes);

    return transaction;
}

async function transfer(resolve, reject, serializedTransaction) {
    web3.eth.sendSignedTransaction('0x' + serializedTransaction, (err, id) => {
        if (err) {
            console.log(err);
            return reject();
        }
        const url = `https://rinkeby.etherscan.io/tx/${id}`;
        resolve({id: id, link: url});
    });
}

async function getCurrentGasPrices() {
    const response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    return {
        low: response.data['safeLow'] / 10,
        medium: response.data['average'] / 10,
        high: response.data['fast'] / 10
    };
}

async function checkBalance(result) {
    let balance = web3.utils.fromWei(result, "ether");
    console.log('Current balance: ' + balance + " ETH");
    if (balance < amountToSend) {
        console.log('insufficient funds');
        return false;
    }

    return true;
}

async function createTransactionBody(address, nonce, gasPrices) {
    return {
        "to": address,
        "value": web3.utils.toHex(web3.utils.toWei(amountToSend.toString(), unit)),
        "gas": gasLimit,
        "gasPrice": gasPrices.low * 1000000000,
        "nonce": nonce,
        "chainId": chainID
    };
}

if (receiverAddress && amountToSend) {
    signAndTransfer({address: myAddress, privateKey: key},
        {address: receiverAddress}, amountToSend)
        .then((result) => console.log(result))
        .catch((err) => console.log(err));
} else {
    console.log("Failed to get receiver address and amount ETH to send");
}
