import ta from 'ta.web';
var ccxt = require('ccxt');
var config = require('../config');


const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001 ;


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization");
    app.use(cors());
    next();
    console.log(`funcionou`)
});

let bought = false;
let comprado = false;
let comp = false;
let Katta = false;

let sold = false;
let vendido = false;
let Ureta = false;
let vend = false;
const symbol = config.SYMBOL;

app.get('/', async(req, res) => {

    

        console.log('')
        /* SISTEMA AVAX/BTC */

        var exchange = new ccxt.ftx({
            'apiKey': 'tyv6hUyY5QoMqx0Zg8coaMqDO5nsLeBK-CKYobcJ',
            'secret': 'DjT6L28adBi-7IiL1sVeVjt2TL_QcuOpKC3kmYOE'
        });

        /* ACESSANDO CANDLES OHLC */
        const mercado = await exchange.load_markets ();
        const data = (await exchange.fetchOHLCV ('AVAX/BTC', '15m'));
        const open = (data.map(candleO => parseFloat(candleO[1]))).reverse()
        const high = (data.map(candleH => parseFloat(candleH[2]))).reverse()
        const low  = (data.map(candleL => parseFloat(candleL[3]))).reverse();
        const close = (data.map(candleC => parseFloat(candleC[4]))).reverse()

        /* MÉDIAS DE MÓVEIS */
        const fastMedian  = await ta.sma(low, 88);
        const slowMedian  = await ta.sma(high, 100);
        const threeMedian = await ta.sma(high, 3);


        /* RSI 15m */

        const param = low;
        const src = 30;    

        function calcRSI(param) {
            let gains = 0;
            let losses = 0;
        
            for (let i = param.length - src; i < param.length; i++) {
                const diff = param[i] - param[i - 1];
                if (diff >= 0)
                    gains += diff;
                else
                    losses -= diff;
            }
        
            const strength = gains / losses;
            return 100 - (100 / (1 + strength))
        }

        const rsi = calcRSI(param);

        /* CONVERÇÃO DE MOEDAS */ 
        const reg = (await exchange.fetchOHLCV ('BTC/USD', '15m')).reverse();
        const regax = (await exchange.fetchOHLCV ('AVAX/USD', '15m')).reverse();
        const avaxbtc = (await exchange.fetchOHLCV ('AVAX/BTC', '15m')).reverse();
        const cambio = reg.map(cand1 => parseFloat(cand1[4]));   
        const xavasc = regax.map(cand2=> parseFloat(cand2[4]));
        const convert = avaxbtc.map(cand3 => parseFloat(cand3[4]));
        const saldo = await exchange.fetchBalance();
        const BTC = ((saldo.total['BTC'])*cambio[0]);
        const USD = (saldo.total['USD'])
        const free = ((saldo.free['BTC'])*cambio[0]);
        const used = ((saldo.used['BTC'])*cambio[0]);
        const AVAX = ((saldo.total['AVAX'])*(xavasc[0]));

        const Soma = (USD+AVAX+BTC)



        /* ANALISE DE WALLET */
        let quantity = ((saldo.free['BTC'])/convert[0]);


        /* CRIAÇÃO DE PROFITS */ 
        const trades = (await exchange.fetchOrders ('AVAX/BTC')).reverse(); 
        const Savax  = parseFloat((trades[0].price)*config.SELL_PROFITY);


        /* CRUZAMENTO DE MEDIAS */
        const crossover = (fastMedian[1]>slowMedian[1] && fastMedian[2]<slowMedian[2]);
        const crossunder = (fastMedian[1]<slowMedian[1] && fastMedian[2]>slowMedian[2]);

        let ClBuy  = trades[0].amount;
        let ClSell = trades[0].amount;

        /* MOMENTO DO TRADE */
        const tstamp    = parseFloat(trades[0].timestamp);
        const CandAtual = data.map(c=> parseFloat(c[0]));
        const timer     = (1000*60*15)

        /* REGISTRO DE MAREGM LIVRE */

        const lado   = trades[0].side;
        const ativo  = trades[0].symbol

        if(lado === "buy" && (free) < (AVAX)){
            comprado = true;
            console.log('AVAX/BTC')
            console.log('Comprado em AVAX')

        }else{
            comprado = false;
        }

        if(lado === "sell" && (free) > (AVAX)){
            vendido = true;
            console.log('AVAX/BTC')
            console.log('Comprado em Bitcoin')
            console.log(`Profit em ${Savax}`)
        }else{
            vendido = false;
        }


        /* ESTATÉGIAS , CONDIÇÕES E ORDENS AVAX  15MIN */

        if( rsi<45 && close[1]>open[1] && threeMedian[1]<close[1] && close[1]<fastMedian[1] && close[1]<slowMedian[1] && comprado && ((tstamp+timer)<CandAtual[0])){
            console.log("Comprando Bitcoin")
            //sell = exchange.createMarketSellOrder('AVAX/BTC', ClSell);       
        }

        if( !comprado && vendido && ((close[0]) <= Savax) ){
            console.log("Comprando AVAX")
            //var buy = exchange.createMarketBuyOrder('AVAX/BTC', quantity);
        }

        /* SISTEMA DE BTC/USD */

        var exchange15 = new ccxt.ftx({
            'apiKey': 'fDhvBqPiAMLxlQZgjKdksdRKO3y9y1P07Ebtf6Fd',
            'secret': 'Ru0DmmYIVmxiQZ4nZ75z_P6tAdDoV351Q2qYMq78',
            'headers' : {
                'FTX-SUBACCOUNT' : 'SUBVENDAS'
            }
        });

        /* ACESSANDO CANDLES OHLC */
        const mercado15 = await exchange15.load_markets ();
        const data15 = (await exchange15.fetchOHLCV ('BTC/USD', '15m'));
        const open15 = (data15.map(candleO => parseFloat(candleO[1]))).reverse();
        const high15 = (data15.map(candleH => parseFloat(candleH[2]))).reverse();
        const low15  = (data15.map(candleL => parseFloat(candleL[3]))).reverse();
        const close15 = (data15.map(candleC => parseFloat(candleC[4]))).reverse();

        /* MÉDIAS DE MÓVEIS */
        const fastMedian15  = await ta.sma(high15, 7);
        const slowMedian15  = await ta.sma(low15, 140);
        const threeMedian15 = await ta.sma(high15, 3);


            /* RSI 15m */

            const param15 = low15;
            const src15 = 30;    
        
            function calcRSI15(param15) {
                let gains15 = 0;
                let losses15 = 0;
            
                for (let i = param15.length - src; i < param15.length; i++) {
                    const diff15 = param15[i] - param15[i - 1];
                    if (diff15 >= 0)
                        gains15 += diff15;
                    else
                        losses15 -= diff15;
                }
            
                const strength15 = gains15 / losses15;
                return 100 - (100 / (1 + strength15))
            }
        
            const rsi15 = calcRSI15(param15);

        /* CONVERÇÃO DE MOEDAS 15m*/ 
        const reg15 = (await exchange15.fetchOHLCV ('BTC/USD', '15m')).reverse();
        const cambio15 = reg15.map(cand15 => parseFloat(cand15[4]));   
        const BTC15 = cambio15[0];
        const saldo15 = await exchange15.fetchBalance(symbol);
        const USD15 = (saldo15.total['USD']);
        const free15 = (saldo15.free['USD']);
        const SalBTC = (saldo15.total['BTC']);
        
        const Soma15 = ((SalBTC*BTC15)+USD15)


        /* ANALISE DE WALLET */
        let quantity15 = (free15/cambio15[0]);
        let qntNegociation15   = quantity15/close15[0];

        /* CRIAÇÃO DE PROFITS 15m */
        const trades15 = (await exchange15.fetchOrders ('BTC/USD')).reverse();        
        const buyProfit15 = parseFloat((trades15[0].price)*config.BUY_PROFITY15);
        const sellProfit15 = parseFloat((trades15[0].price)*config.SELL_PROFITY15);

        /* CRUZAMENTO DE MEDIAS */
        const crossover15 = (fastMedian15[1]>slowMedian15[1] && fastMedian15[2]<slowMedian15[2]);
        const crossunder15 = (fastMedian15[1]<slowMedian15[1] && fastMedian15[2]>slowMedian15[2]);

        let ClBuy15  = trades15[0].amount;
        let ClSell15 = trades15[0].amount;

        /* MOMENTO DO TRADE */
        const tstamp15    = parseFloat(trades15[0].timestamp);
        const CandAtual15 =  data15.map(c=> parseFloat(c[0]));
        const timer15     = (1000*60*15)

        /* REGISTRO DE MAREGM LIVRE */

        const lado15   = trades15[0].side;
        const ativo15 = trades15[0].symbol

        if(SalBTC > 0.00001){
            console.log('BTC/USD')
            console.log('Comprado em Bitcoin')
            console.log(`Profit em ${buyProfit15}`)
            bought = true;
            sold   = false;
        }else{
            console.log('BTC/USD')
            console.log('Vendido em Bitcoin')
            console.log(`Profit em ${sellProfit15}`)
            bought = false;
            sold   = false;
        }

        /* ESTATÉGIAS , CONDIÇÕES E ORDENS 15 MIN */

        if( close[0]<fastMedian15 && close[0]<slowMedian15 && close[0]>threeMedian15 && close[0]>open[0] && rsi15<41 && !bought && sold ){
            console.log("Compra 15min")
            //var buy15 = exchange15.createMarketBuyOrder('BTC/USD', quantity15);      
        }

        if( bought && !sold && ((close[0])>=buyProfit15)){
            console.log("Fechando Compra 15min")
            //var sell15 = exchange15.createMarketSellOrder('BTC/USD', ClBuy15);
        }


        /* SISTEMA DE BCH FUTURES 1H */

        var exchange60 = new ccxt.ftx({
            'apiKey': 'YwQ2E2gsuhV_EoaBRyACSRKkftrxPQ34aX_vbMaR',
            'secret': 'q8-jUYb-oACbFrZGyCyvimIHkRKLilDPqRB5BUrq',
            'headers' : {
                'FTX-SUBACCOUNT' : 'Optimus'
        }
        });

        /* ACESSANDO CANDLES OHLCV 1h*/
        const mercado60 = await exchange60.load_markets ();
        const data60  = ((await exchange60.fetchOHLCV (symbol, '1h'))).reverse();
        const open60  = data60.map(candleOpen => parseFloat(candleOpen[1]));
        const high60  = data60.map(candleHigh => parseFloat(candleHigh[2]));
        const low60   = data60.map(candleLoow => parseFloat(candleLoow[3]));
        const close60 = data60.map(candleClose => parseFloat(candleClose[4]));

        /* MÉDIAS DE MÓVEIS 1h*/
        const fastMedian60 = await ta.sma(high60, 20);
        const slowMedian60 = await ta.sma(close60, 300);

        /* CONVERÇÃO DE MOEDAS 1h*/ 
        const reg60 = (await exchange60.fetchOHLCV ('BTC/USD', '5m')).reverse();
        const cambio60 = reg60.map(cand60 => parseFloat(cand60[4]));   
        const BTC60 = cambio60[0];
        const saldo60 = await exchange60.fetchBalance(symbol);
        const USD60 = ((saldo60.total['BTC'])*cambio60[0]);
        const free60 = (((saldo60.free['BTC'])*cambio60[0])/close60[0]);  
        const used60 = (((saldo60.used['BTC'])*cambio60[0])/close60[0]);

        const Soma60 = (USD60+(saldo60.total['USD']))
        

        /* ANALISE DE WALLET */
        let quantity60 = (free60);
        let qntNegociation60 = quantity60*1.85

        /* CRIAÇÃO DE PROFITS 1h */
        const trades60 = (await exchange60.fetchOrders (symbol)).reverse();        
        const buyProfit60 = parseFloat((trades60[0].price)*config.BUY_PROFITY60);
        const sellProfit60 = parseFloat((trades60[0].price)*config.SELL_PROFITY60);

        /* CRUZAMENTO DE MEDIAS60m*/
        const crossover60 = (fastMedian60[1]>slowMedian60[1] && fastMedian60[2]<slowMedian60[2]);
        const crossunder60 = (fastMedian60[1]<slowMedian60[1] && fastMedian60[2]>slowMedian60[2]);

        let ClBuy60  = trades60[0].amount;
        let ClSell60 = trades60[0].amount;

        /* MOMENTO DO TRADE */
        const tstamp60 = parseFloat(trades60[0].timestamp);
        const CandAtual60 =  data60.map(c60=> parseFloat(c60[0]));
        const timer60 = (1000*60*60)

        /* REGISTRO DE MAREGM LIVRE */
        const lado60 = trades60[0].side;

        if(lado60 === "buy" && (free60) < (used60)){
            console.log('BCHPERP 1H')
            console.log('Comprado em BCH')
            console.log(`Profit em ${buyProfit60.toFixed(2)}`)
            comp = true;
        }else{
            comp = false;
        }

        if(lado60 === "sell" && (free60) < (used60)){
            console.log('BCHPERP 1H')
            console.log('Vendido em BCH')
            console.log(`Profit em ${sellProfit60.toFixed(2)}`)
            vend = true;
        }else{
            vend = false;
        }


        /* ESTATÉGIAS , CONDIÇÕES E ORDENS 1h */

        if(crossover60 && !comp && !vend ){
            console.log("Compra 1h")
            //var buy60 = exchange60.createMarketBuyOrder(symbol, qntNegociation60);
            //buyOrders.push(buyProfit);          
        }

        if((crossunder60  && comp && !vend) ||(((close60[0])>=buyProfit60) && comp && !vend)){
            console.log("Fechando Compra 1h")
            //var sell60 = exchange60.createMarketSellOrder(symbol, ClBuy60);
        }

        if(crossunder60 && !comp && !vend){
            console.log(`Venda 1h`)
            //var sell60 = exchange60.createMarketSellOrder(symbol, qntNegociation60);
            //sellOrders.push(sellProfit);
        }

        if((crossover60 && !comp && vend) || (((close60[0])<=sellProfit60) && !comp && vend)){
            console.log(`Fechando Venda 1h`)
            //var buy60 = exchange60.createMarketBuyOrder(symbol, ClSell60); 
        }    


        /* SISTEMA BCH FUTURES DIARIO */

        var exchangeD = new ccxt.ftx({
            'apiKey': 'K_hbGUmbXhAoLsnH91_9YSCHd2Yn6umrgb4Z9pty',
            'secret': 'h9WnYUWmR2mn8Mfx-OQYSLt8tXRHMWPBGXwFBcMG',
            'headers' : {
                'FTX-SUBACCOUNT' : 'Prime'
        }
        });

        /* ACESSANDO CANDLES OHLCV 1D*/
        const mercadoD = await exchangeD.load_markets ();
        const dataD = (await exchangeD.fetchOHLCV (symbol, '1d'));
        const openD = (dataD.map(candleOpe => parseFloat(candleOpe[1]))).reverse();
        const highD = (dataD.map(candleHig => parseFloat(candleHig[2]))).reverse();
        const lowD = (dataD.map(candleLow => parseFloat(candleLow[3]))).reverse();
        const closeD = (dataD.map(candleClo => parseFloat(candleClo[4]))).reverse();

        /* MÉDIAS DE MÓVEIS */
        const fastMedianD  = await ta.sma(highD, 7);
        const slowMedianD  = await ta.sma(lowD, 140);
        const threeMedianD = await ta.sma(highD, 3);


        /* CONVERÇÃO DE MOEDAS DIARIO*/ 
        const regD = (await exchangeD.fetchOHLCV ('BTC/USD', '5m')).reverse();
        const cambioD = regD.map(candD => parseFloat(candD[4]));   
        const BTCD = cambioD[0];
        const saldoD = await exchangeD.fetchBalance(symbol);
        const USDD = ((saldoD.total['BTC'])*cambioD[0]);
        const freeD = (((saldoD.free['BTC'])*cambioD[0])/closeD[0]);
        const usedD = (((saldoD.used['BTC'])*cambioD[0])/closeD[0]);

        const SomaD = (USDD+(saldoD.total['USD']))
        

        /* ANALISE DE WALLET */
        let quantityD  = (freeD);
        let qntNegociationD  = quantityD*1.85      

        /* CRIAÇÃO DE PROFITS DIARIO */
        const tradesD = (await exchangeD.fetchOrders (symbol)).reverse();        
        const buyProfitD = parseFloat((tradesD[0].price)*config.BUY_PROFITYD);
        const sellProfitD = parseFloat((tradesD[0].price)*config.SELL_PROFITYD); 

        /* CRUZAMENTO DE MEDIAS */
        const crossoverD = (fastMedianD[1]>slowMedianD[1] && fastMedianD[2]<slowMedianD[2]);
        const crossunderD = (fastMedianD[1]<slowMedianD[1] && fastMedianD[2]>slowMedianD[2]);

        let ClBuyD  = tradesD[0].amount;
        let ClSellD = tradesD[0].amount;

        /* MOMENTO DO TRADE */
        const tstampD    = parseFloat(tradesD[0].timestamp);
        const CandAtualD =  dataD.map(c=> parseFloat(c[0]));
        const timerD  = (1000*60*1440)

        /* REGISTRO DE MAREGM LIVRE */

        const ladoD   = tradesD[0].side;
        const ativoD  = tradesD[0].symbol;

        if(ladoD === "buy" && (freeD) < (usedD)){
            console.log('BCHPERP DIARIO')
            console.log('Comprado em BCH')
            console.log(`Profit em ${buyProfitD}`)
            Katta = true;
        }else{
            Katta = false;
        }

        if(ladoD === "sell" && (freeD) < (usedD)){
            console.log('BCHPERP DIARIO')
            console.log('Vendido em BCH')
            console.log(`Profit em ${sellProfitD}`)
            Ureta = true;
        }else{
            Ureta = false;
        } 

        /* ESTATÉGIAS , CONDIÇÕES E ORDENS DIARIO */

        if(crossoverD && !Katta && !Ureta  ){
            console.log("Compra do Dia")
            //var buyD = exchangeD.createMarketBuyOrder(symbol, qntNegociationD);
        }

        if((crossunderD && Katta && !Ureta) || (((closeD[0])>=buyProfitD) && Katta && !Ureta)){
            console.log("Fechando Compra do Dia")
            //var sellD = exchangeD.createMarketSellOrder(symbol, ClSellD);
        }

        if(crossoverD && !Katta && !Ureta ){
            console.log(`Venda do Dia`)
            //var sellD = exchangeD.createMarketSellOrder(symbol, qntNegociationD);   
        }

        if((crossunderD && !Katta && Ureta) || (((closeD[0])<=sellProfitD) && !Katta && Ureta )){
            console.log(`Fechando Venda do Dia`)
            //var buyD = exchangeD.createMarketBuyOrder(symbol, ClSellD); 
        } 


        let balance = (parseFloat((Soma+Soma15+Soma60+SomaD).toFixed(2)))

        return ({
            erro: false,
            datahome: {
                balance
                
            }
        });

    
    

});

app.listen(port, () => {
    console.log(`Servidor iniciado na porta: ${port}`);
});

