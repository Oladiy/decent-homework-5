# **Project description**

В программу "зашит" секретный ключ от Ethereum адреса. Программа принимает параметрами количество ETH, которое необходимо отправить и адрес назначения. На выходе программа печатает в консоль результат - подписанную транзакцию в формате JSON, которую можно отправить в сети Ethereum.

Изначально берется тестовая сеть Rinkeby. Для выбора другой сети Ethereum нужно заменить значения chain и chainID.

# **Install**

`npm install`

# **Run**

`nodejs SignAndTransfer.js`