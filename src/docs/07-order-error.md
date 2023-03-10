# 7. Ошибки заявок

## **7.1. Группировка ошибок**

Во время работы робота могут возникать ошибки при выставлении, перемещении и снятии заявок. Такие ошибки сами по себе не являются показателем неправильной работы робота. Это штатное поведение робота. Все ошибки, получаемые с биржи, классифицируются на несколько групп для удобства их обработки (например, на Московской бирже есть более десяти различных кодов ошибок, суть которых сводится к тому, что у клиента не хватает денег для выставления заявки). Ошибки снятия заявки чаще всего возникают тогда, когда после отправления приказа на снятие заявки и до обработки этого приказа биржей, заявка успевает пройти в сделку. Далее будут рассмотрены ошибки выставления и переставления заявок.

- **Ошибка:** Order adding error on *, error: REASON_NO_MONEY

**Что делать:** Нехватка денег на счете. Проверьте хватает ли у вас денег на счете для выставления заявки по данной бумаге данного объема. Торговля будет остановлена автоматически.

**Важно:** С биржи приходит много разных сообщений об ошибке выставления заявки, в роботе они сгруппированы и под ошибку REASON_NO_MONEY попадает несколько разных сообщений от биржи, например: "Account has insufficient Available Balance" и "Value of position and orders exceeds position Risk Limit". Эти сообщения присылает биржа в ответ на выставление заявки, робот сам никогда не возвращает ошибку REASON_NO_MONEY, это только сообщение с биржи. Почему приходит данное сообщение спрашивайте у соответствующей биржи. Сообщение, непосредственно пришедшее с биржи, вы можете найти в логе графической части робота.

- **Ошибка:** order adding error on *, continue trading, error: REASON_FLOOD

**Что делать:** Флуд-контроль, превышен лимит максимального разрешенного количества транзакций (удалений/снятий заявок) в секунду для данного логина или биржа прислала сообщение в духе Биржа перегружена, попробуйте позже или некоторые другие сообщения от биржи, которые говорят о том, что биржа сейчас испытывает некоторые трудности, но в принципе работает. Для данного робота совершить 30 транзакций в секунду (единица транзакционной активности Московской биржи, принятая на текущий момент) - это элементарно.

**Важно:** 99% всех сообщений приходящих вам о флуд-контроле являются внутренними сообщениями робота, то есть ваши приказы не доходят до биржи, а отклоняются заранее роботом и потому штрафа вы не получите.
Ошибка: order adding error on *, continue trading, error: REASON_UNDEFINED

**Что делать:** Вы получите эту ошибку в том случае, если ошибку выставления заявки, которую присылает биржа, робот видит впервые (в документации бирж очень часто описаны не все сообщения об ошибках или их описание отсутствует в принципе). В случае данной ошибки в лог графической части приходит сообщение, которое прислала биржа, читайте его внимательнее, абсолютно не факт что что-то не так с роботом и нужно писать в поддержку, и у бирж бывают проблемы. Если же вы понимаете что данное сообщение должно быть как-то обработано роботом, например, как REASON_FLOOD или REASON_NO_MONEY, то пишите в поддержку.

**Ошибка:** order adding error on *, continue trading, error: REASON_PRICE_OUT_OF_LIMIT

**Что делать:** Данная ошибка означает, что цена заявки вне лимита, и это нормально, так может быть, т.к. цены бумаг в некоторых случаях рассчитываются и зависят от ваших настроек. Возможно, вам следует поменять настройки.

**Ошибка:** order adding error on *, continue trading, error: REASON_CROSS

**Что делать:** Данная ошибка возникает когда вы пытаетесь торговать сами с собой. При возникновении данной ошибки на инструменте первой ноги, заявка не выставится, робот продолжит работу по алгоритму. При возникновении данной ошибки на инструментах второй ноги, робот попробует выставить заявку снова по новой цене, сместившись на один шаг цены вглубь своей стороны стакана.

**Ошибка:** order adding error on *, continue trading, error: REASON_ZERO_AMOUNT_TO_MULTIPLE

**Что делать:** Для некоторых бирж (к примеру Deribit) объем заявки должен быть кратным размеру лота. Перед выставлением заявки происходит округление объёма до целого числа лотов. Округление всегда происходит в меньшую сторону. Если объем выставляемой заявки меньше размера лота, то после округления объём выставляемой заявки будет равен нулю, робот видит это и возвращает ошибку. Для предотвращения подобных ошибок можно установить Overlay равным единице и выше.

**Ошибка:** CONN_NAME can not find order on exchange: sec=SEC_KEY, oNo=ORDER_NO

**Что делать:** Сообщение означает, что наша заявка, которая до сих пор была реальной заявкой, теперь просто не находится на бирже и мы не знаем ее судьбу, поэтому рекомендуется выключить торговлю, сбросить статусы заявок, сверить позы с биржей, после чего можно снова включать торговлю.

## **7.2. Коды ошибок**

### **7.2.1. MOEX FORTS**

**MOEX SPECTRA ERRORS**<br>
-1 Error performing operation.<br>
0 Operation successful.<br>
0 Operation successful.<br>
1 User not found.<br>
2 Brokerage Firm code not found.<br>
3 Session inactive.<br>
4 Session halted.<br>
5 Error performing operation.<br>
6 Insufficient rights to perform operation.<br>
7 Cannot perform operation: incorrect Clearing Firm account.<br>
8 Insufficient rights to perform order deletion.<br>
9 Operations with orders are blocked for the firm by the Clearing Administrator.<br>
10 Insufficient funds to reserve.<br>
12 Options premium exceeds the limit allowed.<br>
13 Total amount of positions exceeds the market limit.<br>
14 Order not found.<br>
25 Unable to add order: prohibited by the Trading Administrator.<br>
26 Unable to open position: prohibited by Trading Administrator.<br>
27 Unable to open short position: prohibited by Trading Administrator.<br>
28 Unable to perform operation: insufficient rights.<br>
31 Matching order for the same account/ITN is not allowed.<br>
32 Trade price exceeds the limit allowed.<br>
33 Operations with orders are blocked for this firm by the Clearing Administrator.<br>
34 Cannot perform operation: wrong client code.<br>
35 Invalid input parameters.<br>
36 Cannot perform operation: wrong underlying.<br>
37 Multi-leg orders cannot be moved.<br>
38 Negotiated orders cannot be moved.<br>
39 Price is not a multiple of the tick size.<br>
40 Unable to add Negotiated order: counterparty not found.<br>
41 User's trading rights have expired or are not valid yet.<br>
42 Operations are prohibited by Chief Trader of Clearing Firm.<br>
43 The 'Lock Mode' flag is not set by the Trading Administrator.<br>
44 Clearing Firm's Chief Trader flag not found for this firm.<br>
45 Unable to add Negotiated orders: no RTS code found for this firm.<br>
46 Only Negotiated orders are allowed for this security.<br>
47 There was no trading in this security during the session specified.<br>
48 This security is being delivered. Only Negotiated orders from all Brokerage Firms within the same Clearing Firm are allowed.<br>
49 Unable to add Negotiated order: a firm code must be specified.<br>
50 Order not found.<br>
53 Error setting input parameter: amount too large.<br>
54 Unable to perform operation: exceeded operations quota for this client.<br>
55 File not found.<br>
56 Unable to perform operations using this login/code pair: insufficient rights. Please contact the Trading Administrator.<br>
57 Unable to connect to the Exchange server: insufficient rights. Please contact the Trading Administrator.<br>
58 Unable to add orders without verifying client funds sufficiency: insufficient rights.<br>
60 Auction halted for all risk-netting instruments.<br>
61 Trading halted in all risk-netting instruments.<br>
62 Trading halted on the MOEX Derivatives Market.<br>
63 Auction halted in all risk-netting instruments with this underlying.<br>
64 Trading halted in all risk-netting instruments with this underlying.<br>
65 Trading halted on all boards in all securities with this underlying.<br>
66 Trading halted in this risk-netting instrument.<br>
67 Unable to open positions in this risk-netting instrument: prohibited by the Trading Administrator.<br>
68 Unable to add orders for all risk-netting instruments: prohibited by the Brokerage Firm.<br>
69 Unable to add orders for all risk-netting instruments: prohibited by the Chief Trader.<br>
70 Trading operation is not supported.<br>
71 Position size exceeds the allowable limit.<br>
72 Order is being moved.<br>
73 Aggregated buy order quantity exceeds the allowable limit.<br>
74 Aggregated sell order quantity exceeds the allowable limit.<br>
75 Non-trading operation was unsuccessful due to timeout.<br>
76 No record to delete.<br>
200 Collateral calculation parameters are being changed by the Trading Administrator.<br>
201 Collateral calculation parameters are being changed by the Trading Administrator.<br>
202 Collateral calculation parameters are being changed by the Trading Administrator.<br>
203 Collateral calculation parameters are being changed by the Trading Administrator.<br>
204 Collateral calculation parameters are being changed by the Trading Administrator.<br>
205 Collateral calculation parameters are being changed by the Trading Administrator.<br>
206 Collateral calculation parameters are being changed by the Trading Administrator.<br>
207 Collateral calculation parameters are being changed by the Trading Administrator.<br>
208 Collateral calculation parameters are being changed by the Trading Administrator.<br>
209 Collateral calculation parameters are being changed by the Trading Administrator.<br>
210 Collateral calculation parameters are being changed by the Trading Administrator.<br>
211 Collateral calculation parameters are being changed by the Trading Administrator.<br>
212 Collateral calculation parameters are being changed by the Trading Administrator.<br>
213 Collateral calculation parameters are being changed by the Trading Administrator.<br>
214 Collateral calculation parameters are being changed by the Trading Administrator.<br>
215 Collateral calculation parameters are being changed by the Trading Administrator.<br>
216 Collateral calculation parameters are being changed by the Trading Administrator.<br>
217 Collateral calculation parameters are being changed by the Trading Administrator.<br>
218 Collateral calculation parameters are being changed by the Trading Administrator.<br>
219 Collateral calculation parameters are being changed by the Trading Administrator.<br>
220 Collateral calculation parameters are being changed by the Trading Administrator.<br>
221 Collateral calculation parameters are being changed by the Trading Administrator.<br>
222 Collateral calculation parameters are being changed by the Trading Administrator.<br>
223 Collateral calculation parameters are being changed by the Trading Administrator.<br>
224 Collateral calculation parameters are being changed by the Trading Administrator.<br>
225 Collateral calculation parameters are being changed by the Trading Administrator.<br>
226 Collateral calculation parameters are being changed by the Trading Administrator.<br>
227 Collateral calculation parameters are being changed by the Trading Administrator.<br>
228 Collateral calculation parameters are being changed by the Trading Administrator.<br>
229 Collateral calculation parameters are being changed by the Trading Administrator.<br>
230 Code value not found.<br>
231 Bad 'num' sequence for code.<br>
232 There are no any futures data for code.<br>
233 There are no any key point for code.<br>
234 'minstep' parameter is 0 for code.<br>
235 'code' and 'num' values not found.<br>
236 No calculation result.<br>
237 fortsFutRisks library is not inited.<br>
238 settlement_price_last_clearing param is null for code.<br>
239 No spot for code.<br>
240 Market data params is incorrect for code.<br>
241 Collateral calculation parameters are being changed by the Trading Administrator.<br>
242 Collateral calculation parameters are being changed by the Trading Administrator.<br>
243 Collateral calculation parameters are being changed by the Trading Administrator.<br>
244 Collateral calculation parameters are being changed by the Trading Administrator.<br>
245 Collateral calculation parameters are being changed by the Trading Administrator.<br>
246 Collateral calculation parameters are being changed by the Trading Administrator.<br>
247 Collateral calculation parameters are being changed by the Trading Administrator.<br>
248 Collateral calculation parameters are being changed by the Trading Administrator.<br>
249 Collateral calculation parameters are being changed by the Trading Administrator.<br>
250 Collateral calculation parameters are being changed by the Trading Administrator.<br>
310 Unable to add order: prohibited by Clearing Administrator.<br>
311 Unable to open position: prohibited by Clearing Administrator.<br>
312 Unable to open short position: prohibited by Clearing Administrator.<br>
314 Unable to add orders in the client account: prohibited by the Trader.<br>
315 Unable to open position in the client account: prohibited by the Trader.<br>
316 Unable to open short position in the client account: prohibited by the Trader.<br>
317 Amount of buy/sell orders exceeds the limit allowed.<br>
318 Unable to add order for the client account: client does not have a deposit account for settlement of Money Market securities. Prohibited by Clearing Administrator.<br>
320 Amount of active orders exceeds the limit allowed for the client account for this security.<br>
331 Insufficient funds in the Settlement Account.<br>
332 Insufficient client funds.<br>
333 Insufficient Brokerage Firm funds.<br>
334 Insufficient Clearing Firm funds.<br>
335 Unable to buy: amount of securities exceeds the limit set for the client.<br>
336 Unable to buy: amount of securities exceeds the limit set for the Brokerage Firm.<br>
337 Unable to sell: amount of securities exceeds the limit set for the client.<br>
338 Unable to sell: amount of securities exceeds the limit set for the Brokerage Firm.<br>
339 Collateral recalculation in progress.<br>
380 Trading restricted while intraday clearing is in progress.<br>
381 Trading restricted while intraday clearing is in progress: cannot delete orders.<br>
382 Trading restricted while intraday clearing is in progress: cannot move orders.<br>
383 Non-trading operations restricted while intraday clearing is in progress.<br>
400 Incorrect request.<br>
401 Not authorized.<br>
403 Restricted. Client is not permitted to execute request.<br>
404 Not Found.<br>
405 Method is not supported.<br>
407 Proxy server authentication required.<br>
409 Conflict detected.<br>
415 Data type is not supported.<br>
422 Incorrect document body.<br>
500 Internal server error.<br>
501 Request is not implemented.<br>
600 Incorrect date of request.<br>
601 Outcoming number uniqueness violation.<br>
602 Unsupported request type.<br>
603 Incorrect UNICODE.<br>
680 Insufficient client funds.<br>
681 Insufficient Clearing Firm funds.<br>
682 Insufficient funds to increase position.<br>
2000 Unable to create SMA login: SMA login must be either of client login, or of Brokerage Firm login.<br>
2001 Unable to create SMA login: SMA logins must belong to trading participants.<br>
2002 Unable to add orders using this SMA login: the MASTER login does not belong to trading participants.<br>
4000 Invalid input parameters.<br>
4001 Unable to perform operation: insufficient rights.<br>
4002 Unable to change trading limit for the client: no active trading sessions.<br>
4004 Unable to change trading limit for the client: client code not found.<br>
4005 Unable to change the trading limit for the client: insufficient funds.<br>
4006 Unable to set trading limit for the client: error performing operation.<br>
4007 Unable to set trading limit for the client: error performing operation.<br>
4008 Unable to set trading limit for the client: error performing operation.<br>
4009 Unable to set trading limit for the client: error performing operation.<br>
4010 Unable to set trading limit for the client: error performing operation.<br>
4011 Unable to set trading limit for the client: error performing operation.<br>
4012 Unable to set trading limit for the client: error performing operation.<br>
4013 Unable to set trading limit for the client: error performing operation.<br>
4014 Unable to change parameters: no active trading sessions.<br>
4015 Unable to change parameters: client code not found.<br>
4016 Unable to change parameters: underlying's code not found.<br>
4017 Unable to set trading limit for the client: amount too large.<br>
4018 Collateral calculation parameters are being changed by the Trading Administrator.<br>
4019 Initial margin: error setting contract parameters.<br>
4020 Transaction is already active.<br>
4021 Unable to set requested amount of pledged funds for Clearing Firm: insufficient amount of free funds.<br>
4022 Unable to set requested amount of funds for Clearing Firm: insufficient amount of free funds.<br>
4023 Unable to change trading limit for the Brokerage Firm: no active trading sessions.<br>
4024 Unable to change trading limit for the Brokerage Firm: the Brokerage Firm is not registered for trading.<br>
4025 Unable to set requested amount of pledged funds for the Brokerage Firm: insufficient amount of free funds in the Clearing Firm.<br>
4026 Unable to set requested amount of funds for the Brokerage Firm: insufficient amount of free funds in the balance of the Separate Account.<br>
4027 Unable to set requested amount of pledged funds for the Clearing Firm: insufficient amount of pledged funds in the balance of the Separate Account.<br>
4028 Unable to set requested amount of funds for the Brokerage Firm: insufficient amount of free funds in the Clearing Firm.<br>
4030 Unable to change parameters for the Brokerage Firm: no active sessions.<br>
4031 Unable to change parameters for the Brokerage Firm: Brokerage Firm code not found.<br>
4032 Unable to change parameters for the Brokerage Firm: underlying's code not found.<br>
4033 Unable to change parameters for the Brokerage Firm: insufficient rights to trade this underlying.<br>
4034 Transfer of pledged funds from the Separate Account is prohibited.<br>
4035 Transfer of collateral is prohibited.<br>
4040 Unable to change Brokerage Firm limit on risk-netting: no active sessions.<br>
4041 Unable to change Brokerage Firm limit on risk-netting: Brokerage Firm is not registered for trading.<br>
4042 Unable to change Brokerage Firm limit on risk-netting: Brokerage Firm code not found.<br>
4043 Unable to change Brokerage Firm limit on risk-netting: error performing operation.<br>
4044 Unable to change Brokerage Firm limit on risk-netting: error performing operation.<br>
4045 Unable to delete Brokerage Firm limit on risk-netting: error performing operation.<br>
4046 Unable to remove Chief Trader's restriction on trading in risk-netting instruments: insufficient rights.<br>
4050 Unable to process the exercise request: restricted by the Chief Trader.<br>
4051 Unable to process the exercise request: restricted by the Brokerage Firm.<br>
4052 Unable to process the exercise request: wrong client code and/or security.<br>
4053 Unable to process the exercise request: cannot delete orders during the intraday clearing session.<br>
4054 Unable to process the exercise request: cannot change orders during the intraday clearing session.<br>
4055 Unable to process the exercise request: order number not found.<br>
4060 Unable to process the exercise request: insufficient rights.<br>
4061 Unable to process the exercise request: deadline for submitting requests has passed.<br>
4062 Unable to process the exercise request: client code not found.<br>
4063 Unable to process the exercise request: request not found.<br>
4064 Unable to process the exercise request: insufficient rights.<br>
4065 Unable to process the exercise request: option contract not found.<br>
4066 Unable to process the exercise request: request to disable automatic exercise may only be submitted on the option's expiration date.<br>
4067 Unable to process the exercise request: error performing operation.<br>
4068 Unable to process the exercise request: error performing operation.<br>
4069 Unable to process the exercise request: error performing operation.<br>
4070 Unable to process the exercise request: insufficient amount of positions in the client account.<br>
4090 No active sessions.<br>
4091 Client code not found.<br>
4092 Underlying's code not found.<br>
4093 Futures contract not found.<br>
4094 Futures contract does not match the selected underlying.<br>
4095 Partial selection of futures contracts not accepted: underlying flag set 'For all'.<br>
4096 Unable to remove restriction: no restriction set.<br>
4097 Unable to remove: the Chief Trader's restriction cannot be removed by Brokerage Firm trader.<br>
4098 Security not found in the current trading session.<br>
4099 Both securities must have the same underlying.<br>
4100 Exercise date of the near leg of a multi-leg order must not be later than that of the far leg.<br>
4101 Unable to make a multi-leg order: lots are different.<br>
4102 No position to move.<br>
4103 The FOK order has not been fully matched.<br>
4104 Anonymous repo order must contain a repo type.<br>
4105 Order containing a repo type is restricted in this multi-leg order.<br>
4106 Multi-leg orders can be added only on the Money Market.<br>
4107 This procedure is not eligible for adding orders for multi-leg securities.<br>
4108 Unable to trade risk-netting instruments in T0: insufficient rights.<br>
4109 Rate/swap price is not a multiple of the tick size.<br>
4110 The near leg price differs from the settlement price.<br>
4111 The rate/swap price exceeds the limit allowed.<br>
4112 Unable to set restrictions for multi-leg futures.<br>
4115 Unable to transfer funds between Brokerage Firm accounts: no active sessions.<br>
4116 Unable to transfer funds between Brokerage Firm accounts: the donor Brokerage Firm is not registered for trading.<br>
4117 Unable to transfer funds between Brokerage Firms: the receiving Brokerage Firm is not registered for trading.<br>
4118 Brokerage Firm does not have sufficient amount of free funds.<br>
4119 Brokerage Firm does not have sufficient amount of collateral.<br>
4120 Insufficient amount of free funds in the balance of the Separate Account.<br>
4121 Insufficient amount of collateral in the balance of the Separate Account.<br>
4122 Clearing Firm does not have sufficient amount of free funds.<br>
4123 Brokerage Firm does not have sufficient amount of collateral.<br>
4124 Brokerage Firm code not found.<br>
4125 Unable to transfer funds between accounts of different Clearing Firms.<br>
4126 Unable to transfer: error while transferring.<br>
4127 Insufficient free funds in the Settlement Account.<br>
4128 Brokerage firm does not have sufficient amount of free funds.<br>
4129 Insufficient amount of free funds in the balance of the Separate Account.<br>
4130 Clearing Firm does not have sufficient amount of free funds.<br>
4131 Brokerage Firm code not found.<br>
4132 Unable to withdraw: error in withdrawal logic.<br>
4133 No requests to cancel.<br>
4134 Brokerage Firm does not have sufficient amount of funds.<br>
4135 Clearing firm does not have sufficient amount of funds.<br>
4136 Prohibited to transfer pledged funds.<br>
4137 Brokerage Firm does not have sufficient amount of pledged funds.<br>
4138 Insufficient funds to withdraw from the Settlement Account.<br>
4139 Insufficient free collateral in the Settlement Account.<br>
4140 Unable to transfer: position not found.<br>
4141 Unable to transfer: insufficient number of open positions.<br>
4142 Cannot transfer positions from the client account to an account with a different ITN.<br>
4143 Unable to transfer position: the Brokerage Firms specified belong to different Clearing Firms.<br>
4144 Cannot transfer positions to 'XXYY000' Brokerage Firm account.<br>
4145 Unable to transfer positions for the selected Brokerage Firm: restricted by the Trading Administrator.<br>
4146 Transferring positions in the selected securities is prohibited.<br>
4147 Option contract not found.<br>
4148 Settlement Account does not have sufficient amount of pledged funds.<br>
4149 Settlement Account does not have sufficient amount of funds.<br>
4150 Unable to balance risk using specified futures instrument.<br>
4151 Specified FX Market Firm code not found.<br>
4152 Specified FX Market Settlement Account not found.<br>
4153 Specified FX Market financial instrument not found.<br>
4154 Unable to add request for FX Market: the required parameters are not registered in the system.<br>
4155 Required Administrator login for adding a risk balancing request is not registered in the system.<br>
4160 Funds transfer between settlement accounts is prohibited. Settlement account is included in the Unified Collateral Pool.<br>
4161 Withdrawal is prohibited. Settlement account is included in the Unified Collateral Pool.<br>
4162 Unable to perform operation. The Brokerage Firms must be of the same Settlement account.<br>
4163 Unable to perform operation. To transfer funds for Brokerage Firm with virtual limit, you are required to apply to NCC.<br>
4164 Unable to perform operation. It is prohibited to change settings for client accounts.<br>
4165 Unable to perform operation. Only Clearing Firm logins are able to perform the operation.<br>
4166 Incorrect combination of flag values.<br>
4167 Settlement Account not found.<br>
4168 Unable to transfer assets between Brokerage Firms of different settlement accounts outside of the main trading session.<br>
4169 Cannot perform operation: the operation is available for Clearing Firm/Brokerage Firm login only.<br>
4170 Cannot perform operation: incorrect Brokerage Firm account.<br>
4171 Cannot perform operation: incorrect client account.<br>
4172 Cannot perform operation: insufficient rights for the Clearing Member.<br>
4173 Cannot perform operation: insufficient rights for the Trading Member.<br>
4200 Cannot confirm request. Trading participant's MASTER login is not connected.<br>
4201 Cannot confirm request. Price value in request exceeded the current price value.<br>
4202 Cannot confirm request. Maximum number of contracts exceeded in request.<br>
4203 Cannot confirm request. Negotiated mode is not allowed.<br>
4204 Cannot confirm request. Maximum volume in Russian Ruble exceeded in request.<br>
4205 Cannot confirm request. Amount in Russian Ruble exceeded total available amount in requests per trading day.<br>
4206 Cannot confirm request. Number of buy orders exceeded maximum available number in position.<br>
4207 Cannot confirm request. Number of sell orders exceeded maximum available number in position.<br>
4208 Cannot confirm request. Total quantity of simultaneous restrictions on position size for different clearing register exceeded for given SMA login.<br>
4209 Cannot confirm request.<br>
4210 Cannot confirm request.<br>
4211 Cannot confirm request.<br>
4212 Cannot confirm request.<br>
4213 Cannot confirm request.<br>
4214 Cannot confirm request.<br>
4215 Cannot confirm request.<br>
4216 Cannot confirm request.<br>
4217 Cannot confirm request.<br>
4218 Cannot confirm request.<br>
4219 Cannot confirm request.<br>
4220 Trading operations for user are prohibited.<br>
4221 Unable to perform operation: Clearing Member and Trading Member represent the same entity.<br>
4222 Unable to perform operation with orders: insufficient rights for Clearing Member.<br>
4223 Unable to send request to NCC: insufficient rights for Trading Member.<br>
4224 Unable to perform operation: insufficient rights for active MASTER logins.<br>
4225 Reserve error code. The text will be updated later.<br>
4226 Reserve error code. The text will be updated later.<br>
4227 Reserve error code. The text will be updated later.<br>
4228 Reserve error code. The text will be updated later.<br>
4229 Reserve error code. The text will be updated later.<br>
4230 Orders will not be cancelled: collateral requirements are met for the Brokerage Firm.<br>
4231 Reserve error code. The text will be updated later.<br>
4232 Reserve error code. The text will be updated later.<br>
4233 Reserve error code. The text will be updated later.<br>
4234 Reserve error code. The text will be updated later.<br>
4235 Reserve error code. The text will be updated later.<br>
4236 Reserve error code. The text will be updated later.<br>
4237 Reserve error code. The text will be updated later.<br>
4238 Reserve error code. The text will be updated later.<br>
4239 Reserve error code. The text will be updated later.<br>
4240 Reserve error code. The text will be updated later.<br>
9999 Too many transactions sent from this login.<br>
10000 System level error while processing message.<br>
10001 Undefined message type.<br>
10004 Invalid message type.<br>
10005 MQ address is too large.<br>
10006 Error parsing message.<br>
11123 Deal accepted<br>
11124 Deal accepted & matched<br>
11125 Deal accepted (unvalidated)<br>
11129 Invalid security id<br>
11130 Negotiated deals not accepted for indices<br>
11131 Security is not trading yet<br>
11132 Security is in break period<br>
11133 Security is not currently trading<br>
11134 Trading in security is finished<br>
11135 Security is not trading today<br>
11136 Security is suspended<br>
11138 Instrument is suspended<br>
11139 Board is suspended<br>
11140 Invalid buy or sell indicator<br>
11141 Invalid counterparty firm<br>
11143 Invalid price<br>
11144 Invalid quantity<br>
11145 Invalid trading account<br>
11146 Trading account is suspended<br>
11147 Trading account's depository account is suspended<br>
11149 Account has insufficient balance to sell<br>
11155 Invalid deal number<br>
11156 Deal is currently unmatched<br>
11157 Deal is already validated<br>
11158 Deal is currently in an unknown state<br>
11159 Invalid order method for this security and board<br>
11160 Buy order accepted<br>
11161 Sell order accepted<br>
11162 Buy order accepted<br>
11163 Sell order accepted<br>
11164 Order quantity is incorrect<br>
11165 Buy order accepted (open period)<br>
11166 Sell order accepted (open period)<br>
11167 Minimum price step is set<br>
11168 Lot size is set<br>
11169 Buy order accepted (unvalidated)<br>
11170 Sell order accepted (unvalidated)<br>
11171 Invalid market order value<br>
11172 Orders not accepted for indices<br>
11173 Invalid order type<br>
11174 Invalid price split flag<br>
11175 Invalid fill flag<br>
11176 A market order must allow price splits<br>
11177 Market orders not accepted during security's open period<br>
11178 Single price orders not accepted during security's open period<br>
11179 Immediate orders not accepted during security's open period<br>
11180 Price may not be 0 for a limit order<br>
11181 Immediate option not allowed for a market order that will stay in order book<br>
11182 Price is out of range<br>
11187 Unable to match order<br>
11193 Invalid order number<br>
11194 You may not specify an order number and a user<br>
11197 You do not have access to this function<br>
11198 Trading System unavailable<br>
11199 Trading System is suspended<br>
11201 Unable to service request<br>
11202 You do not have access to the Trading System<br>
11210 Order withdrawn<br>
11211 Deal withdrawn<br>
11213 Invalid price operator<br>
11218 Invalid firm code<br>
11219 No orders withdrawn, rejection(s)<br>
11222 No negotiated deals to withdraw<br>
11230 Order value is incorrect<br>
11231 Only main board orders may be entered during primary auction<br>
11234 Order may not have immediate flag in primary auction<br>
11235 Only issuer agent may enter primary auction sell order<br>
11239 Sell order may not be a single price order in primary auction<br>
11240 Sell order should have zero quantity in primary auction<br>
11241 Auction bidding period is finished for security<br>
11242 Price must be 0 for market orders in primary auction<br>
11243 Market orders percentage limit will be breached<br>
11244 Firm cash limit will be breached for this instrument<br>
11245 Firm total cash limit will be breached<br>
11246 Buy order accepted<br>
11247 Sell order accepted<br>
11252 Security is in primary distribution<br>
11263 Trading account limit will be exceeded<br>
11271 Negotiated deals are not allowed during this period<br>
11361 Invalid order method for firm<br>
11363 Only negotiated deal orders are accepted for this trading account<br>
11364 Buy orders are not accepted for this trading account<br>
11365 Sell orders are not accepted for this trading account<br>
11368 Unable to match Force Partial Withdraw Order<br>
11376 Orders canceled successfully<br>
11407 Invalid order method for trdacc<br>
11408 Fill Withdraw option not allowed for a market order<br>
11409 No weighted average price exists<br>
11413 Firm and Counterparty must be the same for deals on this board<br>
11414 Price is outside of allowed range<br>
11415 One side of the deal must have a client account<br>
11416 One side of the deal must have a members own account<br>
11419 No bid or offer price exists for the source security and board<br>
11424 No Second Part Price exists for REPO<br>
11425 No Rate Of Interest exists for REPO<br>
11429 REPO Upper limit breached<br>
11438 REPO rate out of range<br>
11439 REPO second part period is not closed<br>
11443 Yield is outside of allowed range<br>
11445 Cross trades not allowed for this instrument<br>
11446 Firm cash limit for the Second Part of REPO will be breached<br>
11447 Total cash limit for REPO operations will be breached<br>
11448 Invalid settle code specified<br>
11449 Invalid number of trades<br>
11450 Invalid trade number<br>
11451 You can not validate this trade<br>
11452 These trades can not be validated<br>
11453 Trade is already validated<br>
11454 There is a report for buy trade<br>
11456 Report accepted<br>
11457 Report accepted & matched<br>
11458 Invalid report number specified<br>
11459 Report withdrawn<br>
11460 No reports to withdraw<br>
11461 There already exists a buy quote for specified security and settlement code<br>
11462 There already exists a sell quote for specified security and settlement code<br>
11463 Quote withdrawn<br>
11464 No quotes to withdraw<br>
11465 Reports are not allowed during this period<br>
11486 Order value is incorrect<br>
11497 Invalid character in brokerref<br>
11498 Invalid character in matchref<br>
11499 Invalid character in extref<br>
11507 Order quantity doesn't match security's granularity ( lots)<br>
11508 Account has insufficient convsecurity balance to sell<br>
11509 Immediate WAPrice orders not accepted during security's open period<br>
11510 Immediate WAPrice orders not accepted during primary auction<br>
11511 Immediate WAPrice orders could not be queued<br>
11512 Buy order accepted<br>
11513 Sell order accepted<br>
11515 Refund rate is not allowed for the settle code specified<br>
11516 Incomplete repo order<br>
11517 Invalid refund rate<br>
11518 Invalid REPO rate<br>
11519 Invalid price2<br>
11520 Negative or zero price2 resulted<br>
11521 Can't send report to trade due to invalid price<br>
11522 Invalid combination of market, board, instrument and security<br>
11523 REPO rate must not exceed<br>
11533 Invalid client code<br>
11536 Order must be a limit order<br>
11537 Order may not be a single price order<br>
11538 Order should have zero quantity<br>
11539 Buy order already entered<br>
11540 Price must be 0 for market orders in auction<br>
11543 Auction price can not be calculated<br>
11548 Repo Rate is incorrect<br>
11549 Repo Rate is incorrect<br>
11550 Limit will be breached for position<br>
11554 Invalid discount specified<br>
11555 Invalid lower discount specified<br>
11556 Invalid upper discount specified<br>
11557 Invalid block collateral flag<br>
11558 Invalid repo value specified<br>
11559 Invalid price resulted<br>
11560 Invalid quantity resulted<br>
11561 Invalid REPO value resulted<br>
11562 Invalid REPO repurchase value resulted<br>
11563 Main board is not defined for the security<br>
11565 Market price is not defined for the security<br>
11566 Starting discount can not be less than lower discount limit<br>
11567 Starting discount can not be greater than upper discount limit<br>
11568 This report can not be cleanly accepted<br>
11573 Invalid settlement code or REPO term specified<br>
11575 Buy Order accepted. Balance withdrawn to avoid a cross trade<br>
11576 Sell Order accepted. Balance withdrawn to avoid a cross trade<br>
11577 This order causes a cross trade<br>
11578 Total order value at single repo rate can not exceed limit.<br>
11579 For this instrument price is less than allowed<br>
11580 For this instrument price is greater than allowed<br>
11581 Starting discount is less than allowed<br>
11582 Starting discount is greater than allowed<br>
11583 Lower discount limit is incorrect<br>
11584 Upper discount limit is incorrect<br>
11585 Lower discount limit must not be specified<br>
11586 Upper discount limit must not be specified<br>
11587 Block collateral option must be set<br>
11588 Repo Rate is greater than allowed<br>
11594 REPO base condition is incorrect for this board<br>
11599 Invalid price2 resulted<br>
11600 Minimum rate step is incorrect<br>
11601 Minimum discount step is incorrect<br>
11602 REPO value for this instrument is incorrect<br>
11603 REPO repurchase value for this instrument is incorrect<br>
11608 Not allowed client code type for this trading account.<br>
11609 Not allowed client code type for this trading account.<br>
11612 Order value is larger than allowed<br>
11613 Order value is less than allowed<br>
11615 Invalid deal number<br>
11616 Unable to accept deal - deal is not active<br>
11617 Unable to accept deal<br>
11618 Unable to accept deal. Invalid security specified<br>
11619 Unable to accept deal. Invalid price specified<br>
11620 Unable to accept deal. Invalid quantity specified<br>
11621 Unable to accept deal. Invalid settlecode specified<br>
11622 Unable to accept deal. Invalid refundrate specified<br>
11623 Unable to accept deal. Invalid matchref specified<br>
11624 Unable to accept deal. Invalid buy/sell specified<br>
11625 Warning: this will breach REPO limit. If sure, set firm's limit check flag to 'N' for position and retry<br>
11626 Invalid trading account for marketmaker order<br>
11627 Marketmaker orders accepted only in normal trading period<br>
11628 Invalid order type for marketmaker order<br>
11629 Buy Order accepted. Balance withdrawn to avoid a trade between marketmakers<br>
11630 Sell Order accepted. Balance withdrawn to avoid a trade between marketmakers<br>
11631 This order causes a trade between marketmakers<br>
11632 Is in breach of MGF<br>
11633 Is in breach of MGF<br>
11635 Discount limits can not be set<br>
11636 Margin call does not need any counterpart's acceptance<br>
11647 Total sell quantity of a security for a firm can not exceed of its issue size on this board<br>
11648 Clearing session is in progress<br>
11649 Trade is already canceled -<br>
11650 There is a cancel report for buy trade<br>
11651 There is a cancel report for sell trade<br>
11652 Trade can not be canceled<br>
11653 Cancel report accepted & matched<br>
11654 Cancel report accepted<br>
11655 Unable to select boards<br>
11658 Invalid client code specified for this security<br>
11660 External trade registered:<br>
11661 Invalid settle date specified<br>
11662 External trades withdrawn<br>
11663 Invalid external trade number<br>
11664 Invalid large trade flag<br>
11665 No external trades to withdraw<br>
11666 This trade have to be large<br>
11667 Invalid large flag specified<br>
11668 Invalid clearing type specified<br>
11669 Only one trade can be included in simple clearing report<br>
11670 Simple clearing is not currently available<br>
11671 Specified tradesuccessfully settled<br>
11672 Invalid trade number specified: '<br>
11673 Trade already settled<br>
11674 Trade unvalidated<br>
11675 Trade is not in simple clearing mode<br>
11676 REPO first part trade is not validated yet for trade<br>
11677 REPO first part trade is not settled yet for trade<br>
11678 Simple clearing is not allowed for position<br>
11679 Margin calls can not be included in simple clearing<br>
11680 Trade value must be not less than for simple clearing<br>
11694 Simple clearing is not allowed for this security and board<br>
11695 Simple clearing is not allowed for the same trading accounts<br>
11699 Counter price is not defined<br>
11700 Order must be entered with counter price flag<br>
11701 Order price is incorrect<br>
11702 Settlement date of the REPO second part trade is not a working day<br>
11703 Invalid date specified<br>
11704 Only BUY orders are allowed at this moment<br>
11705 Only SELL orders are allowed at this moment<br>
11706 You are not an underwriter. Only security underwriters are allowed to enter order at this moment<br>
11707 Invalid transaction reference<br>
11718 There is a confirm report for trade<br>
11719 Trade is not included into clearing<br>
11720 Special report a not available now<br>
11721 ClientCode is not allowed for this trading account<br>
11730 The price of the buy order should be less then the best offer price for this type of order<br>
11731 The price of the sell order should be greater then the best bid price for this type of order<br>
11732 The quantity of lots is less than allowed<br>
11733 The quantity of lots is greater than allowed<br>
11734 Volume of the order is less than allowed<br>
11735 Volume of the order is greater than allowed<br>
11736 Signature validation error.<br>
11737 Used wrong signature or EXKEYUSAGEOID<br>
11740 Clients without signature are not supported<br>
11741 The trading account and the secutity belong to different depositories<br>
11742 Only NegDeals addressed to everyone available in that trading period<br>
11743 This settle code is unavailable<br>
11744 The second part of REPO trade cannot be canceled.<br>
11745 The transfer cannot be canceled.<br>
11746 Specified tradesuccessfully canceled<br>
11747 Unable to determine price move limit for this security<br>
11748 The price for this security should be in range from to<br>
11749 Only one of RepoValue or Quantity can be specified<br>
11750 REPO price is not defined<br>
11751 Starting discount must not be specified.<br>
11752 Discount limits must not be specified.<br>
11754 You have got a deferred money debt. This debt should be settled by the end of this day or tomorrow during the settlement with the Central counterparty.<br>
11755 You have got deferred security debts. These debts should be settled by the end of this day or tomorrow during the settlement with the Central counterparty.<br>
11756 You have got a default on collaterals. All the defaults on collaterals must be settled by 15:00 today.<br>
11757 You have got an unsettled deferred money debt. The default settlement procedure will be enforced.<br>
11758 You have got an unsettled collaterals default. The default settlement procedure will be enforced.<br>
11759 You have got a deferred money claim. This claim will be satisfied by the Central counterparty either by the end of this day or tomorrow during the settlement with CC.<br>
11760 You have got deferred security claims. Claims will be satisfied by the Central counterparty either by the end of this day or tomorrow during the settlement with CC.<br>
11761 The firm's limit on liabilities to the Central counterparty has been exceeded.<br>
11782 Simple report can not be complex<br>
11783 Client code is suspended<br>
11784 Specified tradesuccessfully notified as payment pended<br>
11786 Operations suspended by Firm Manager or Trading System Superviser<br>
11787 User successfully suspended<br>
11788 User successfully suspended. Orders withdrawn<br>
11789 User successfully Unsuspended<br>
11790 The total amount of deferred debts of the unconscionable clearing participants exceeds the limit set for the settlement with the Central counterparty. CC's own assets will not be used during the settlement.<br>
11791 There are no deferred debts for the settlement with the Central counterparty<br>
11792 You have got deferred security claims on the board for the position caused by the default on this position. Claims will be settled by the Central counterparty after the default settlement.<br>
11793 You have got a deferred money claim on the board for the position caused by the default on this position. Claim will be settled by the Central counterparty after the default settlement.<br>
11794 The total amount of deferred debts of the unconscionable clearing participants does not exceed the limit set for the settlement with the Central counterparty. CC's own assets will be used during the settlement.<br>
11795 United limit breached<br>
11796 Trading limit breached<br>
11797 Limit for currency<br>
11802 Cash position for currency will be breached<br>
11804 Value must not be specified for position withdraw flag<br>
11805 Value must be negative for specified position withdraw flag<br>
11807 Bank Account is in default mode<br>
11808 Bank Account is not in default mode<br>
11809 Bank Account is in early settle mode<br>
11810 Bank Account is in trading closed mode<br>
11812 Limits will be breached for position<br>
11813 Cannot cancel trade. Parent trade should be canceled<br>
11814 Maximum order hidden quantity ratio is incorrect<br>
11815 Minimum order visible quantity value is incorrect<br>
11816 Hidden quantity can not be specified for market maker order<br>
11817 Minimum order visible quantity is less than allowed<br>
11819 Buy order accepted (closing auction)<br>
11820 Sell order accepted (closing auction)<br>
11821 Events in past time are not allowed<br>
11822 Buy order accepted (dark pool)<br>
11823 Sell order accepted (dark pool)<br>
11824 Client code type must a legal entity<br>
11826 Matchref must not be specified for this type of counter party<br>
11827 Allowed only trades with the same bank account for this period<br>