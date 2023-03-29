# **10. API v2**

## **10.1. Подписки**

### **10.1.1. Подписка на "дерево"**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"1","data":{"topic":"robots"}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"robots", "admin":true}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;
`admin` - получать данные доступные только для админа.

_Ответ (снапшот):_

```C
{"type": "callback", "data":{"robots":{"1":{"portfolios":{"test":{"re_buy":false, "re_sell":false, "all_free":1, "disabled":false, "securities":{"BNF_BTCUSDT":{"sec_key": "BNF_BTCUSDT", "sec_type":34359738368, "client_code": "virtual", "sec_key_subscr": "BTCUSDT"}}, "has_virtual":true, "name": "test", "owner": "test@gmail.com"}}, "trans_conns":{"0_virtual":{"sec_pos":null, "coin_pos":null, "disabled":false, "sec_type":0, "name": "virtual", "full_name": "virtual"}}, "data_conns":{"34359738368_binancefut_listen":{"disabled":false, "sec_type":34359738368, "name": "binancefut_listen"}}, "start":false, "rl": "", "rv": "", "rvd":0, "mc":0, "de":-1, "dt":0, "pms":1, "name": "1", "rc":false}, "12":{"portfolios":{"test":{"re_buy":false, "re_sell":false, "all_free":1, "disabled":false, "securities":{"BNF_BTCUSDT":{"sec_key": "BNF_BTCUSDT", "sec_type":34359738368, "client_code": "virtual", "sec_key_subscr": "BTCUSDT"}}, "has_virtual":true, "name": "test", "owner": "test@gmail.com"}}, "trans_conns":{"0_virtual":{"sec_pos":null, "coin_pos":null, "disabled":false, "sec_type":0, "name": "virtual", "full_name": "virtual"}}, "data_conns":{"34359738368_binancefut_listen":{"disabled":true, "sec_type":34359738368, "name": "binancefut_listen"}}, "start":true, "rl": "", "rv": "", "rvd":0, "mc":0, "de":-1, "dt":0, "pms":0, "name": "12", "rc":false}}, "snapshot":true}, "ts":1646903524392865792, "clOrdId": "1"}
```

`snapshot` - означает снапшот это или обновление;  
`re_sell/re_buy` - портфель может покупать/продавать;  
`all_free` - нет активных заявок в портфеле;  
`disabled` - портфель отключен;  
`has_virtual` - торговля с использованием виртуальных подключений;  
`name` - имя;  
`owner` - создатель/хозяин портфеля;  
`client_code` - используемое торговое подключение;  
`start` - флаг, означающий должен ли быть в данный момент включен робот;  
`rl` - имя робота;  
`rv` - версия робота;  
`rvd` - дата версии робота;  
`mc` - число проходов главного цикла событий в секунду;  
`mtc` - лимит транзакционных подключений;  
`de` - осталось дней до окончания лицензии (0 - лицензия закончилась, <=0 - не известно);  
`dt` - дата/время на сервере робота;  
`pms` - права (FOR_ALL = 0, USER = 1, ADMIN = 10);  
`rc` - робот подключен;  
`wr` - робот ожидает перезапуска после смены "критичных" настроек;  
`gc` - все подключения робота к биржам подключены (CLOSED = 0, OPENING = 1, ONLINE = 2, UNKNOWN = 3);  
`tr` - торговля включена или есть активные заявки (NOT_TRADING = 0, TRADING = 2, UNKNOWN = 3);  
`shared` - "шареный робот";  
`ip` - доступные адреса;  
`__action` - если равно "del", то удалить данный ключ;  
`clear` - имя ключа, который нужно удалить из данного словаря (удалять нужно первым делом, т.к. в сообщении содержится новое значение данного ключа);  
`expiration` - дата окончания действия лицензии (только для админа);  
`robot_comment` - комментарий (только для админа);  
`max_trans_count` - лимит транзакционных подключений (только для админа);  
`log_days` - сколько дней хранить логи (только для админа);  
`cpu` - исползуемое ядро процессора (только для админа);  
`robot_type` - имя сборки (только для админа);  
`for_all` - робот доступный всем (только для админа);  
`cmd_params` - параметры запуска (только для админа);  
`mail_to` - отправлить сообщение на почты(только для админа);  
`users` - пользователи робота (только для админа);  

_Обновления (приходит только id робота, имя портфеля и бумаги или ключ подключения, и то что обновилось):_

```C
{"type": "callback", "clOrdId": "1", "data": {"robots":{"1":{"portfolios": {"qwe": {"name": "qwe", "securities": {"CEX_BTC_USD": {"__action": "del"}}}}}}, "snapshot": false},"ts":1624516437000000123}
{"type": "callback", "clOrdId": "1", "data":{"robots":{"1":{"rc":true}}, "snapshot":false}, "ts":1646903528002037248}
```

формат сообщения такой же, как у снапшота.

### **10.1.2. Подписка на "обновляемые свойства" робота**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"1","data":{"topic":"monitor","robot_id":"3"}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"monitor","robot_id":["3", "2"]}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"monitor","robot_id":null}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота или список id-роботов (не более 20-ти штук) или null (т.е. все роботы).

_Ответ (снапшот):_

```C
{"type": "callback", "data":{"robots":{"1":{"rv": "4735fc6", "rvd":1646313286, "mc":1364430, "mtc":0, "de":4087, "dt":1646917931000, "rc":true, "start":true, "rl": "", "robot_id": "1"}, "12":{"rv": "", "rvd":0, "mc":0, "de":-1, "dt":0, "rc":false, "start":false, "rl": "", "robot_id": "12"}}, "snapshot":true}, "ts":1646909299756444672, "clOrdId": "1"}
```

`snapshot` - означает снапшот это или обновление.

_Обновления (приходит только id робота, и то что обновилось):_

```C
{"type": "callback", "clOrdId": "1", "data":{"robots":{"1":{"rc":true}}, "snapshot":false}, "ts":1646903528002037248}
```

формат сообщения такой же, как у снапшота.

### **10.1.3. Подписка на транзакционные/market-data подключения**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"1","data":{"topic":"trans_conns","robot_id":"3"}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"data_conns","robot_id":["3", "2"]}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"trans_conns","robot_id":null}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"data_conns","robot_id":["1", "2"], "c_key":"34359738368_binancefut_listen"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота или список id-роботов (не более 20-ти штук) или null (т.е. все роботы);  
`c_key` - id-подключения (это строка в формате "{sec_type}_{name}", для транзакционных подключений name - это короткое имя, без приписки с именем биржи и словом send) или список id-подключений (не более 20-ти штук) или null (т.е. все подключения).

_Ответ (снапшот):_

```C
{"type": "callback", "data":{"robots":{"1":{"data_conns":{"34359738368_binancefut_listen":{"sec_type":34359738368, "name": "binancefut_listen", "bind_ip": "", "use_in_mc":true, "disabled":false, "stream_state":{"Definitions":0, "OB":0, "Socket":1}}}}, "12":{"data_conns":{"34359738368_binancefut_listen":{"name": "binancefut_listen", "bind_ip": "", "disabled":true, "sec_type":34359738368}}}}, "snapshot":true}, "ts":1646909930327924992, "clOrdId": "1"}
```

`snapsho`t - означает снапшот это или обновление.

_Обновления (приходит только id робота, id подключения и то что обновилось):_

```C
{"type": "callback", "clOrdId": "1", "data":{"robots":{"1":{"data_conns":{"34359738368_binancefut_listen":{"sec_type":34359738368, "name": "binancefut_listen", "stream_state":{"Definitions":0, "OB":0, "Socket":2}}}}}, "snapshot":false}, "ts":1646909936001763328}
```

формат сообщения такой же, как у снапшота.

### **10.1.4. Подписка на портфели**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"1","data":{"topic":"portfolios","robot_id":"3"}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"portfolios","robot_id":["3", "2"]}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"portfolios","robot_id":null}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"portfolios","robot_id":["1", "2"], "name":"test"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота или список id-роботов (не более 20-ти штук) или null (т.е. все роботы);  
`name` - имя портфеля или список имен портфелей (не более 20-ти штук) или null (т.е. все портфели).

_Ответ (снапшот):_

```C
{"type": "callback", "data":{"robots":{"1":{"portfolios":{"test":{"k":0, "k1":0, "k2":0, "tp":1, "buy":0, "to0":false, "name": "test", "sell":0, "color": "#FFFFFF", "delta":0, "lim_b":0, "lim_s":0, "owner": "test@gmail.com", "quote":false, "timer":1, "v_max":1, "v_min":-1, "_buy_v":10, "_pos_v":1000, "_poses":false, "btnBuy": "", "buy_tt": "", "opened":0, "re_buy":false, "use_tt":false, "v_in_l":1, "v_in_r":1, "__extra":{"1":10, "2":15, "5":17, "9":10.1234, "11":-123, "13":18704}, "_buy_en":false, "_l_b_en":false, "_l_s_en":false, "_limits":false, "_pos_en":false, "_sell_v":10, "btnSell": "", "comment": "", "fin_res":0, "overlay":0, "percent":100, "price_b":0, "price_s":0, "re_sell":false, "sell_tt": "", "v_out_l":1, "v_out_r":1, "_freq_en":false, "_l_b_val":10, "_l_s_val":10, "_sell_en":false, "_volumes":false, "all_free":1, "btnOrder": "", "decimals":4, "disabled":false, "_buy_time":5, "_l_b_stop":false, "_l_b_time":10, "_l_s_stop":false, "_l_s_time":10, "_pos_time":5, "btnMarket": "", "is_pos_ok":true, "log_level":0, "timetable":[], "_anti_spam":false, "_freq_type":0, "_sell_time":5, "_utilities":false, "buy_status":0, "ext_field1":18704, "ext_field2":0, "mkt_volume":100, "price_type":0, "securities":{"BNF_BTCUSDT":{"k":0, "mm":false, "sl":0, "te":true, "tp":1, "pos":0, "put":-1, "sle":false, "d_pg":4133404800, "k_sl":0, "count":1, "maker":false, "ratio":1, "timer":60, "on_buy":1, "old_pos":0, "sec_key": "BNF_BTCUSDT", "all_free":1, "decimals":4, "depth_ob":1, "is_first":true, "leverage":1, "ob_c_p_t":1, "ob_t_p_t":0, "sec_code": "BTCUSDT", "sec_type":34359738368, "comission":0, "sec_board": "", "ban_period":0, "count_type":0, "ratio_sign":0, "ratio_type":0, "client_code": "virtual", "move_limits":false, "fin_res_mult":1, "mc_level_to0":0, "move_limits1":false, "count_formula": "return 1;", "comission_sign":1, "mc_level_close":0, "sec_key_subscr": "BTCUSDT", "max_trans_musec":1000000, "ratio_b_formula": "return 1;", "ratio_s_formula": "return 1;", "percent_of_quantity":100}}, "trading_tt": "can trade", "type_trade":0, "_fin_res_en":false, "_freq_count":1000, "_freq_delta":10, "ext_field1_": "portfolio p = get_portfolio();\np.extra()[13] ++;\nreturn p.extra()[13];", "ext_field2_": "return 0;", "first_delta":0, "has_virtual":true, "hedge_after":2, "max_running":0, "n_perc_fill":0, "price_check":10, "sell_status":0, "_fin_res_abs":1000, "_fin_res_val":10, "custom_trade":false, "equal_prices":false, "ext_formulas":true, "fin_res_wo_c":0, "return_first":0, "simply_first":false, "tt_only_stop":false, "_fin_res_stop":false, "_fin_res_time":60, "_limits_shift":false, "cur_day_month":10, "portfolio_num":-19, "trade_formula": "return 0;", "virtual_0_pos":false, "max_not_hedged":1, "portfolio_type":0, "_max_running_en":false, "is_fin_res_wo_c":false, "_too_much_n_h_en":false, "_trading_options":false, "opened_comission":0, "move_limits1_date":-1, "always_limits_timer":false, "_max_running_percent":70, "_too_much_n_h_portfolios":100}}}}}, "snapshot":true}, "ts":1646910298974944512, "clOrdId": "1"}
```

`snapshot` - означает снапшот это или обновление.

_Обновления (приходит только id робота, имя портфеля и то что обновилось):_

```C
{"type": "callback", "clOrdId": "1", "data":{"robots":{"1":{"portfolios":{"test":{"name": "test", "owner": "test@gmail.com", "trading_tt": "can not trade"}}}}, "snapshot":false}, "ts":1646910309212547328}
{"type": "callback", "clOrdId": "1", "data":{"robots":{"1":{"portfolios":{"test":{"name": "test", "owner": "test@gmail.com", "ext_field1":18707, "__extra":{"13":18707}}}}}, "snapshot":false}, "ts":1646910547086022144}
```

формат сообщения такой же, как у снапшота.

### **10.1.5. Подписка на таблицу финансовых результатов (раздвижки)**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"1","data":{"topic":"trades","robot_id":"1"}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"trades","robot_id":["1", "2"]}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"trades","robot_id":null}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота или список id-роботов (не более 20-ти штук) или null (т.е. все роботы).

_Ответ (снапшот, приходят записи за последние несколько секунд, для доступа к истории используйте отдельный запрос):_

```C
{"type": "callback", "clOrdId": "1", "data": {"robots":{"3":{"trades": [{"t": 1571923847981999080, "is_sl": false, "name": "qwe2", "price": 7468.5, "buy_sell": 2, "quantity": 1, "tt": "CEX_BTC_USD: SELL quantity=1, price=7468.5000, oNo=3, at 17:30:47", "decimals": 4, "id": 4042437680275238758, "dt":1571923836000529003}, {"t": 1571923836000529003, "is_sl": true, "name": "qwe2", "price": 7476.2, "buy_sell": 1, "quantity": 1, "tt": "CEX_BTC_USD: BUY quantity=1, price=7476.2000, oNo=2, at 17:30:36", "decimals": 4, "id": -3389679118170958657, "dt":1571923836000529003}], "snapshot": true", "mt":1571923836000529003}}},"ts":1624516437000000123}
```

`trades` - список раздвижек;  
`dt` - дата/время на сервере бекенда в формате epoch в наносекундах (в запросах участвует именно оно);  
`robot_id` - id-робота;  
`t` - дата/время в формате epoch в наносекундах;  
`is_sl` - заявки были переставлены по стоп-лосс;  
`buy_sell` - направление, 1 - покупка, 2 - продажа;  
`quantity` - количество в штуках портфелей (всегда целое);  
`price` - цена;  
`tt` - всплывающая подсказка со списком сделок;  
`decimals` - сколько знаков после запятой отображать в цене (price);  
`name` - имя портфеля;  
`id` - уникальный внутренний идентификатор записи;  
`mt` - записи меньше этого времени уже сохранены в базу данных, его необходимо использовать для запроса истории (есть только в снапшоте);  
`snapshot` - означает снапшот это или обновление.

_Обновления:_  
формат сообщения такой же, как у снапшота, приходят новые раздвижки (обновлений по старым раздвижкам не бывает).

### **10.1.6. Подписка на таблицу всех сделок**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"2","data":{"topic":"deals","robot_id":"3"}}
{"type":"subscribe","clOrdId":"2","data":{"topic":"deals","robot_id":["3", "2"]}}
{"type":"subscribe","clOrdId":"2","data":{"topic":"deals","robot_id":null}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота или список id-роботов (не более 20-ти штук) или null (т.е. все роботы).

_Ответ (снапшот, приходят записи за последние несколько секунд, для доступа к истории используйте отдельный запрос):_

```C
{"type": "callback", "clOrdId": "2", "data": {"robots":{"3":{"deals": [{"t": 1571923847981993828, "ono": 3, "sec": "CEX_BTC_USD", "name": "qwe2", "price": 7468.5, "buy_sell": 2, "quantity": 1, "decimals": 4, "id": -4195816474436969915, "dt":1571923836000529003, "cn":"virtual"}, {"t": 1571923836000518880, "ono": 2, "sec": "CEX_BTC_USD", "name": "qwe2", "price": 7476.2, "buy_sell": 1, "quantity": 1, "decimals": 4, "id": -324815817002964722, "dt":1571923836000529003, "cn":"virtual"}, {"t": 1571819580259371838, "ono": 5863, "sec": "BN_ADABTC", "name": "bin1", "price": 4.76e-06, "buy_sell": 2, "quantity": 10000000000, "decimals": 8, "id": 3452938594962378336, "dt":1571923836000529003, "cn":"virtual"}], "snapshot": true, "mt":1571923836000529003}}},"ts":1624516437000000123}
```

`deals` - список сделок;  
`dt` - дата/время на сервере бекенда в формате epoch в наносекундах (в запросах участвует именно оно);  
`robot_id` - id-робота;  
`t` - дата/время в формате epoch в наносекундах;  
`id` - уникальный идентификатор записи;  
`ono` - номер заявки;  
`buy_sell` - направление, 1 - покупка, 2 - продажа;  
`quantity` - количество в штуках портфелей (всегда целое);  
`price` - цена;  
`decimals` - сколько знаков после запятой отображать в цене (price);  
`sec` - уникальный идентификатор бумаги;  
`id` - уникальный внутренний идентификатор записи;  
`cn` - имя подключения с использованием которого была выставлена заявка, которая привела к сделке
name - имя портфеля;  
`mt` - записи меньше этого времени уже сохранены в базу данных, его необходимо использовать для запроса истории (есть только в снапшоте);  
`snapshot` - означает снапшот это или обновление.

_Обновления:_  
формат сообщения такой же, как у снапшота, приходят новые сделки (обновлений по старым сделкам на бывает).

### **10.1.7. Подписка на таблицу всех логов**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"2","data":{"topic":"logs","robot_id":"1"}}
{"type":"subscribe","clOrdId":"2","data":{"topic":"logs","robot_id":["1", "2"], "levels":null}}
{"type":"subscribe","clOrdId":"2","data":{"topic":"logs","robot_id":null, "levels":[5]}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота или список id-роботов (не более 20-ти штук) или null (т.е. все роботы);  
`levels` - список уровней логирования или null (т.е. все уровни).

_Ответ (снапшот, приходят записи за последние несколько секунд, для доступа к истории используйте отдельный запрос):_

```C
{"type": "callback", "data":{"robots":{"1":{"logs":[{"t":1646305069000027685, "level":5, "msg": "test", "dt":1646305069001217792},{"t":1646305070000017878, "level":5, "msg": "test", "dt":1646305070001291264},{"t":1646305071000019686, "level":5, "msg": "test", "dt":1646305071001022720},{"t":1646305072000019168, "level":5, "msg": "test", "dt":1646305072001111552}], "mt":1646305068001127169, "snapshot":true}}}, "ts":1646305072249112064, "clOrdId": "2"}
```

`logs` - список логов;  
`dt` - дата/время на сервере бекенда в формате epoch в наносекундах (в запросах участвует именно оно);  
`robot_id` - id-робота;  
`t` - дата/время в формате epoch в наносекундах;  
`level` - уровень логирования;  
`msg` - сообщение;  
`mt` - записи меньше этого времени уже сохранены в базу данных, его необходимо использовать для запроса истории (есть только в снапшоте);  
`snapshot` - означает снапшот это или обновление.

_Обновления:_  
формат сообщения такой же, как у снапшота, приходят новые логи (обновлений по старым логам на бывает).

### **10.1.8. Подписка на таблицу активных заявок**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"1","data":{"topic":"orders","robot_id":"3"}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"orders","robot_id":["3", "2"]}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"orders","robot_id":null}}
{"type":"subscribe","clOrdId":"1","data":{"topic":"orders","robot_id":["1", "2"], "name":"test"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота или список id-роботов (не более 20-ти штук) или null (т.е. все роботы);  
`name` - имя портфеля или список имен портфелей (не более 20-ти штук) или null (т.е. все портфели).

_Ответ (снапшот):_

```C
{"type": "callback", "data":{"robots":{"10":{"orders":{}}, "1":{"orders":{"1_28034992":{"id":28034992, "owner": "test@gmail.com", "sk": "BNF_BTCUSDT", "ono":1, "p":1, "q":1, "q0":1, "d":1, "dec":4, "st":1, "name": "test"}}}, "12":{"orders":{}}, "11":{"orders":{}}}, "snapshot":true}, "ts":1649149156056958464, "clOrdId": "2"}
```

`snapshot` - означает снапшот это или обновление;  
`id` - уникальный внутренний идентификатор заявки робота;  
`owner` - "хозяин" портфеля;  
`sk` - ключ бумаги;  
`ono` - ext_id или номер заявки;  
`p` - цена;  
`q` - количество;  
`q0` - остаток;  
`d` - направление (BUY = 1, SELL = 2);  
`dec` - знаков после запятой;  
`st` - статус (FREE = 0, ADDING = 1, DELETING = 4, FIRST_DELETING = 5, SL_DELETING = 6, MOVING = 7, ADD_ERROR = 99).

_Обновления (приходит только id робота и обновившиеся заявки, все поля заявок):_

```C
{"type": "callback", "clOrdId": "2", "data":{"robots":{"1":{"orders":{"1_28034992":{"id":28034992, "owner": "test@gmail.com", "sk": "BNF_BTCUSDT", "ono":1, "p":1, "q":1, "q0":1, "d":1, "dec":4, "st":2, "name": "test"}}}}, "snapshot":false}, "ts":1649149157289575424}
```

формат сообщения такой же, как у снапшота.

### **10.1.9. "Админские" подписки**

_Подписка:_  
подписка на сервера: `{"type":"subscribe","clOrdId":"1","data":{"topic":"srvs"}}`  
подписка на внутренние статусы системы: `{"type":"subscribe","clOrdId":"1","data":{"topic":"state"}}`  
`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах.

_Ответ (снапшот):_

```C
{"type": "callback", "data":{"srvs":{"spb_feed_3":{"id": "spb_feed_3", "env": "ubuntu2004", "ips":[], "blds":["rtsfeedtests.ubuntu2004.test", "rtsfeedui.ubuntu2004.ui", "rtsunifiedfeed.ubuntu2004.fix_srv_delay", "rtsunifiedfeed.ubuntu2004.fix_srv_realtime", "rtsunifiedfeed.ubuntu2004.indexes", "rtsunifiedfeed.ubuntu2004.rtsboard", "rtsunifiedfeed.ubuntu2004.spb", "rtsunifiedfeed.ubuntu2004.udp_inc", "rtsunifiedfeed.ubuntu2004.udp_snp"], "st":2, "rbts": {"10": {"cpus": [1], "ips": ["127.0.0.1"], "ps": 2}}}}, "snapshot":true}, "ts":1649765885238300672, "clOrdId": "1"}
{"type": "callback", "data":{"state":{"admin_ws":2}, "snapshot":true}, "ts":1649765885238300672, "clOrdId": "1"}
```

`snapshot` - означает снапшот это или обновление;  
`admin_ws` - статус подключенности админского модуля (CLOSED = 0, OPENING = 1, ONLINE = 2, UNKNOWN = 3);  
`srvs` - сервера;  
`blds` - сборки;  
`st` - статус подключенности сервера (CLOSED = 0, OPENING = 1, ONLINE = 2, UNKNOWN = 3) ps - статус запущенности робота (STOPPED = 0, ACTIVE = 2, UNKNOWN = 3).

_Обновления (приходят все поля обновившегося сервера):_

```C
{"type": "callback", "data":{"srvs":{"spb_feed_3":{"id": "spb_feed_3", "env": "ubuntu2004", "ips":["194.247.151.36"], "blds":["rtsfeedtests.ubuntu2004.test", "rtsfeedui.ubuntu2004.ui", "rtsunifiedfeed.ubuntu2004.fix_srv_delay", "rtsunifiedfeed.ubuntu2004.fix_srv_realtime", "rtsunifiedfeed.ubuntu2004.indexes", "rtsunifiedfeed.ubuntu2004.rtsboard", "rtsunifiedfeed.ubuntu2004.spb", "rtsunifiedfeed.ubuntu2004.udp_inc", "rtsunifiedfeed.ubuntu2004.udp_snp"], "st":1, "rbts": {"10": {"cpus": [1], "ips": ["127.0.0.1"], "ps": 2}}}}, "snapshot":false}, "ts":1649765885238300672, "clOrdId": "1"}
{"type": "callback", "data":{"state":{"admin_ws":1}}, "ts":1649765885238300672, "clOrdId": "1"}
```

формат сообщения такой же, как у снапшота.

### **10.1.10. Уровни логирования**

LEVEL_DEBUG = 0 (обычно, запись пользовательских редактирований робота);  
LEVEL_INFO = 1;  
LEVEL_WARNING = 2;  
LEVEL_ERROR = 3 (это ошибка выставления/снятия заявки, всегда пишется из алгоритма);  
LEVEL_CRITICAL = 4 (в робота пришли "кривые" JSON данные или операция недоступна или закончился ключ);  
LEVEL_ORDER = 5 (это ошибка выставления заявки с выключением торговли, ходит в телеграм);  
LEVEL_NOTIFICATION = 7 (уведомления из алгоритма, ходит в телеграм);  
LEVEL_SHOW_OK = 10 (всегда всплывает сообщение);  
LEVEL_SHOW_ERR = 11 (всегда всплывает сообщение);  
LEVEL_SHOW_WARN = 12 (всегда всплывает сообщение).

### **10.1.11. Отписка**

Для отписки нужно то же самое сообщение, что и при подписке, но с `type` равным `unsubscribe`. Либо можно закрыть соединение.

_Запрос:_

```C
{"type":"unsubscribe","clOrdId":"2","data":{"topic":"logs"}}
```

_Ответ:_

```C
{"type": "last_callback", "ts":1646305072249112064, "clOrdId": "2"}
type - всегда last_callback`
```
