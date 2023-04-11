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
`users` - пользователи робота (только для админа).  

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
```

`type` - всегда `last_callback`.

## **10.2. Запросы**

### **10.2.1. Операции над всеми портфелями робота**

_Запрос:_
обнулить позиции всех активных портфелей: `{"type": "action", "data": {"action":"reset_poses", "robot_id":"1"},"clOrdId":"1"}`;  
сбросить статусы всех заявок всех портфелей: `{"type": "action", "data": {"action":"reset_orders", "robot_id":"1"},"clOrdId":"1"}`;  
попытаться выравнять позиции всех активных портфелей: `{"type": "action", "data": {"action":"to_market_all", "robot_id":"1"},"clOrdId":"1"}`;  
выключить торговлю всех портфелей в базе данных: `{"type": "action", "data": {"action":"stop_trading_db", "robot_id":"1"},"clOrdId":"1"}`;  
включить торговлю всех портфелей в базе данных: `{"type": "action", "data": {"action":"start_trading_db", "robot_id":"1"},"clOrdId":"1"}`

_Ответ:_

```C
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "error"}
```

### **10.2.2. Переподключить все маркет-дата/транзакционные подключения робота**

_Запрос:_

```C
{"type": "action", "data": {"action":"reconnect_d", "robot_id":"1"},"clOrdId":"1"}
{"type": "action", "data": {"action":"reconnect_t", "robot_id":"1"},"clOrdId":"1"}
```

Ответ не предусмотрен.

### **10.2.3. Получить список торговых инструментов доступных в роботе**

_Запрос:_

```C
{"type": "action", "data": {"action":"get_contracts", "robot_id":"1"},"clOrdId":"1"}
```

_Ответ:_

```C
{"type": "callback", "data": {"contracts": {"VT_BTC": {"sec_key": "VT_BTC"}}},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "error"}
```

`put` - пут/кол/другой (CALL = 0, PUT = 1, OTHER = -1);  
`step` -;  
`sec_key` -;  
`sec_key_subscr` -;  
`base_sec_key` -;  
`sec_board` -;  
`sec_code` -;  
`description` -;  
`sec_type` -;  
`d_pg` -;  
`isinid_fast` -;  
`isinid_p2` -;  
`state` -;  
`exec_end` -;  
`strike` -;  
`lot_size` -.

### **10.2.4. Операции над подключениями**

_Запрос:_

отключить маркет-дата подключение: `{"type": "action", "data": {"action":"disable_conn", "robot_id":"1", "name":"binancefut_listen", "sec_type":34359738368},"clOrdId":"1"}`;  
включить маркет-дата подключение: `{"type": "action", "data": {"action":"enable_conn", "robot_id":"1", "name":"binancefut_listen", "sec_type":34359738368},"clOrdId":"1"}`;  
отключить транзакционное подключение: `{"type": "action", "data": {"action":"disable_trans_conn", "robot_id":"1", "name":"trade", "sec_type":34359738368},"clOrdId":"1"}`;  
включить транзакционное подключение: `{"type": "action", "data": {"action":"enable_trans_conn", "robot_id":"1", "name":"trade", "sec_type":34359738368},"clOrdId":"1"}`;  
переподключить маркет-дата подключение: `{"type": "action", "data": {"action":"reconnect_data", "robot_id":"1", "name":"binancefut_listen", "sec_type":34359738368},"clOrdId":"1"}`;  
переподключить транзакционное подключение: `{"type": "action", "data": {"action":"reconnect_trans", "robot_id":"1", "name":"trade", "sec_type":34359738368},"clOrdId":"1"}`;  
удалить транзакционное подключение: `{"type": "action", "data": {"action":"del_trans", "robot_id":"1", "name":"trade", "sec_type":34359738368}, "clOrdId":"1"}`;  
проверить используется ли в роботе транзакционное подключение: `{"type": "action", "data": {"action":"is_used_trans", "robot_id":"1", "name":"trade", "sec_type":34359738368}, "clOrdId":"1"}`;  
удалить транзакционное подключение из базы данных: `{"type": "del_conn_db", "data": {"robot_id":"1", "name":"trade", "sec_type":34359738368}, "clOrdId":"1"}`;  
добавить транзакционное подключение (можно только с сайта): `{"type": "action", "data":{"robot_id":1, "action": "add_trans", "sec_type":34359738368, "name": "test", "ckey": "", "orig": "encoded_params_string","settings":{},"defaults":{}}, "clOrdId": "1"}`;  
редактировать транзакционное подключение (можно только с сайта): `{"type": "action", "data":{"robot_id":1, "action": "edit_trans", "sec_type":34359738368, "name": "test", "ckey": "", "orig": "encoded_params_string","settings":{},"defaults":{}}, "clOrdId": "1"}`.

`robot_id` - id-робота;  
`sec_type` - тип подключения;  
`name` - имя подключения;  
`c_key` - закодированная часть ключа подключения;  
`orig` - переведенный в строку и сжатый словарь изначально настроенных пользователем параметров (нужен для редактирования подключения);  
`settings` - словарь настраиваемых пользователем параметров подключения;  
`defaults` - словарь неизменяемых параметров подключения.  

_Ответ:_

```C
{"type": "callback", "data": {},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"used": false},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "error"}
```

### **10.2.5. Редактирование/использование подключений**

_Запрос:_

задать позицию по бумаге: `{"type": "set_sec_pos", "data": {"robot_id":"1", "name":"trade", "sec_type":34359738368, "key_subscr":"BTCUSD", "f_name":"pos", "f_value":0},"clOrdId":"1"}`;  
задать позицию по валюте: `{"type": "set_coin_pos", "data": {"robot_id":"1", "name":"trade", "sec_type":34359738368, "coin":"BTC", "f_name":"pos", "f_value":0},"clOrdId":"1"}`;  
выставить заявку: `{"type": "place_order", "data": {"robot_id":"1", "name":"trade", "sec_type":34359738368, "key_subscr":"BTCUSD", "dir": 1, "amount": 1, "price": 100, "oc": 1, "cc": "client_code"},"clOrdId":"1"}`;  
снять заявку: `{"type": "cancel_order", "data": {"robot_id":"1", "name":"trade", "sec_type":34359738368, "key_subscr":"BTCUSD", "d": 1, "cc": "client_code", "ono": "1", "cl_ord_id": "2"},"clOrdId":"1"}`.

_Ответ:_

```C
{"type": "callback", "data": {},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "error"}
```

### **10.2.6. Операции над портфелями**

_Запрос:_

попытаться выравнять позицию: `{"type": "action", "data": {"action":"market", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
выключить всю торговлю и снять заявки: `{"type": "action", "data": {"action":"hard_stop", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
в режим "к нулю": `{"type": "action", "data": {"action":"to0", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
сбросить статусы заявок: `{"type": "action", "data": {"action":"reset_statuses", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
выключить все формулы: `{"type": "action", "data": {"action":"formulas_stop", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
включить все формулы: `{"type": "action", "data": {"action":"formulas_start", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
удалить портфель: `{"type": "action", "data": {"action":"del_portfolio", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
отключить портфель: `{"type": "action", "data": {"action":"enable", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
включить портфель: `{"type": "action", "data": {"action":"disable", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
включить торговлю: `{"type": "action", "data": {"action":"start", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
выключить торговлю: `{"type": "action", "data": {"action":"stop", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
удалить бумагу: `{"type": "action", "data": {"action":"del_sec", "robot_id":"1", "params":{"name": "test"}}, "clOrdId":"1"}`;  
купить портфель: `{"type": "action", "data": {"action":"buy", "robot_id":"1", "params":{"name": "test", "amount": 1}}, "clOrdId":"1"}`;  
продать портфель: `{"type": "action", "data": {"action":"sell", "robot_id":"1", "params":{"name": "test", "amount": 1}}, "clOrdId":"1"}`;  
выставить заявку: `{"type": "action", "data": {"action":"order", "robot_id":"1", "params":{"name": "test", "amount": 1, "price": 10, "dir":1, "key": "VT_BTCUSD"}}, "clOrdId":"1"}`;  
отключить портфель в базе данных: `{"type": "disable_portf_db", "data": {"robot_id":"1", "name":"trade"}, "clOrdId":"1"}`.

_Ответ:_

```C
{"type": "callback", "data": {},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "error"}
```

### **10.2.7. Запрос истории**

_Запрос:_

запрос истории логов (хранится не более 5000 записей для каждого робота): `{"type":"g_log", "data":{"msg":"*Comp*", "levels":[1,2], "r_ids":[1,123,"132"], "lim":100, "mt":2000000000000000000}, "clOrdId": "1"}`;  
запрос истории сделок: `("виртуальных" сделок хранится не более 5000 для каждого робота): {"type":"g_deal", "data":{"r_ids":[1,123,"132"], "names":["test"], "cns":["virtual"], "dir":1, "lim":100, "mt":2000000000000000000}, "clOrdId": "1"}`;  
запрос истории "раздвижек" ("виртуальных" "раздвижек" хранится не более 5000 для каждого робота): `{"type":"g_trade", "data":{"r_ids":[1,123,"132"], "names":["test"], "virt":false, "dir":1, "lim":100, "mt":2000000000000000000}, "clOrdId": "1"}`.

`lim` - максимальное количество записей в ответе (для минимального знаения времени может прийти несколько записей и в итоге записей будет больше, чем lim);  
`mt` - макисимально время, которое включать в результирующий список;  
`r_ids` - id роботов для фильтра;  
`levels` - уровни логирования для фильтра;  
`msg` - маска сообщения для фильтра;  
`names` - имена потрфелей для фильтра;  
`cns` - имена подключений для фильтра;  
`dir` - направление сделок/"раздвижек" для фильтра (SELL = 1, BUY = 2);  
`virt` - витруальные раздвижки для фильтра.

_Ответ:_

```C
{"type": "callback", "data":{"logs":[{"r_id":1, "dt":1649926714000983040, "t":1649926714000027079, "level":1, "msg": "Compilation on \"test\" is OK"},{"r_id":123, "dt":1649849875001278720, "t":1649849875000057069, "level":1, "msg": "Compilation on \"test\" is OK"}]}, "ts":1650358372950324480, "clOrdId": "1", "result": "ok"}
{"type": "callback", "data":{"deals":[{"r_id":1, "dt":1649849982000027125, "t":0, "name": "test", "cn": "virtual", "sec": "BTC", "buy_sell":1, "decimals":4, "ono":0, "quantity":1, "price":1.0, "id":-1996989120021058289},{"r_id":1, "dt":1649849981000033594, "t":0, "name": "test", "cn": "virtual", "sec": "BTC", "buy_sell":1, "decimals":4, "ono":0, "quantity":1, "price":1.0, "id":-5354657311403049795}]}, "ts":1650373191833740032, "clOrdId": "1", "result": "ok"}
{"type": "callback", "data":{"trades":[{"r_id":1, "dt":1649849982000023566, "t":0, "name": "test", "virt":false, "tt": "", "buy_sell":1, "decimals":4, "is_sl":false, "quantity":2, "price":0.0, "id":-8613579682376322901},{"r_id":1, "dt":1649849981000029925, "t":0, "name": "test", "virt":false, "tt": "", "buy_sell":1, "decimals":4, "is_sl":false, "quantity":2, "price":0.0, "id":217072095785717187}]}, "ts":1650373410468841728, "clOrdId": "1", "result": "ok"}
```

`r_id` - id робота;  
`dt` - время сделки/"раздвижки" для сравнения с mt (время бекенда);  
`t` - время получения сделки/"раздвижки" роботом;  
`level` - уровень логирования;  
`msg` - сообщение;  
`name` - имя портфеля;  
`cn` - имя подключения;  
`sec` - имя бумаги;  
`buy_sell` - направление (SELL = 1, BUY = 2);  
`decimals` - знаков после запятой в цене;  
`ono` - уникальный для робота внутренний идентификатор заявки;  
`quantity` - количество;  
`price` - цена;  
`id` - уникальный дял робота внутренний идентификатор записи;  
`virt` - витруальная "раздвижка";  
`tt` - сделки раздвижки в текстовом формате;  
`is_sl` - переставлена по stop loss.

### **10.2.8. Вычислить формулу**

_Запрос:_

```C
{"type":"formula_test", "data":{"robot_id":1, "name":"test", "f_title":"Test f", "f_name":"trade_formula", "code":"return 2;", "sname": null}, "clOrdId": "1"}
```

_Ответ:_

```C
{"type": "callback", "data": {"val": 2, "warn": ""},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "error"}
```

### **10.2.9. Вычислить среднюю "раздвижку"**

_Запрос:_

```C
{"type":"calc_avg", "data":{"robot_id":1, "name":"test", "min_dt":1, "max_dt":2000000000}, "clOrdId": "1"}
```

_Ответ:_

```C
{"type":"callback","result":"ok","data":{"text":"HTML_TEXT"},"ts":1651230829184219136,"clOrdId":"1"}
{"type":"callback","result":"error","data":{"text":"Can not calculate values"},"ts":1651230829184219136,"clOrdId":"1"}
```

### **10.2.10. Получить текущие цены используемых бумаг на маркет-дата подключении**

_Запрос:_

```C
{"type": "get_subscribed_secs", "data": {"robot_id":"1", "name":"binancefut_listen", "sec_type":34359738368}, "clOrdId":"1"}
```

_Ответ:_

```C
{"type": "callback", "data": {"contracts": {"VT_BTC": {"sec_key": "VT_BTC"}}},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "error"}
```

`step` -;  
`sec_key` -;  
`sec_key_subscr` -;  
`sec_code` -;  
`coin` -;  
`bid` -;  
`offer` -;  
`decimals` -;  

### **10.2.11. Операции администратора**

_Запрос:_

получить "следующий" id робота: `{"type": "next_robot_id", "clOrdId": "1"}`;  
получить список пользователей: `{"type": "g_usr", "data": {"lim": 100, "of": 0, "email":"xxx", "pmss":[1], "srts": [ ["field1", "asc"], ["field2", "desc"], ["field3", "desc"] ]}, "clOrdId": "1"}`;  
задать параметр робота: `{"type": "set_robot_field", "data": {"robot_id": "1", "k": "label", "v": "robot"}, "clOrdId": "1"}`;  
задать параметр пользователя: `{"type": "e_usr", "data": {"email": "test@gmail.com", "k": "pms", "v": 9}, "clOrdId": "1"}`;  
отправить письмо пользователям: `{"type": "send_mail", "data": {"robot_id": "1", "subj": "Subject", "text": "Text"}, "clOrdId": "1"}`;  
`{"type": "send_mail", "data": {"robot_id":["1", "2"], "subj": "Subject", "text": "Text"}, "clOrdId": "1"}`;  
отправить письмо "ответственным": `{"type": "mail_to", "data": {"robot_id": "1", "subj": "Subject", "text": "Text"}, "clOrdId": "1"}`  
`{"type": "mail_to", "data": {"robot_id":["1", "2"], "subj": "Subject", "text": "Text"}, "clOrdId": "1"}`.

_Ответ:_

```C
{"type": "callback", "data": {"robot_id":12},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data":{"usrs":[{"email": "admin@gmail.com", "ct":0, "pms":10, "tgr": "", "robots":[1]}]}, "ts":1650028809813630464, "clOrdId": "1", "result": "ok"}
{"type": "callback", "data": {"email": "test@gmail.com", "pms": 9},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "error"}
```

`email` - имя пользователя (для g_usr маска имени);  
`pmss` - список прав;  
`srts` - список столбцов для сортировки, с указанием имени столбца и порядка сортировки;  
`lim` - limit;  
`of` - offset;  
`ct` - дата регистрации пользователя;  
`pms` - права;  
`tgr` - телеграм id;  
`robots` - список роботов;  
`k` - имя ключа;  
`v` - значение ключа.

### **10.2.12. Операции над роботами**

_Запрос:_

добавить робота (только админ): `{"type": "add_robot", "data": {"robot_id":2, "robot_comment":"", "robot_name":"qwe", "expiration":2100000000, "max_trans_count":4, "log_days":3, "cpu":0, "cmd_params":"", "robot_type":"vikingrobot.centos8streamARM.vrb_crpt", "srv":"aws_tokyo_d_4", "ip":"172.18.29.253", "mail_to":"", "users":"r.liverovskiy@gmail.com", "shared":false, "for_all":false, "start":true, "save_hist":true}, "clOrdId": "1"}`;  
удалить робота (только админ): `{"type": "del_robot", "data": {"robot_id":2}, "clOrdId": "1"}`;  
выключить робота: `{"type": "stop_robot", "data": {"robot_id":2}, "clOrdId": "1"}`;  
включить робота: `{"type": "start_robot", "data": {"robot_id":2}, "clOrdId": "1"}`;  
перезапустить робота: `{"type": "restart_robot", "data": {"robot_id":2}, "clOrdId": "1"}`.

_Ответ:_

```C
{"type": "callback", "data": {},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
```

`robot_id` - id робота;  
`robot_comment` - комментарий;  
`robot_name` - имя (может менять не только админ);  
`expiration` - дата окончания лицензии;  
`max_trans_count` - лимит транзакционных подключений;  
`log_days` - сколько дней хранить логи;  
`cpu` - ядро;  
`cmd_params` - параметры командной строки для запуска;  
`robot_type` - сборка;  
`srv` - сервер;  
`ip` - ip-адреса (строка через запятую);  
`mail_to` - кому слать письма;  
`users` - пользователи (строка через запятую);  
`shared` - "шареный" робот;  
`for_all` - робот доступен всем;  
`start` - сразу включить робота;  
`save_hist` - сохранять историю сделок в базу данных.

### **10.2.13. Служебные операции**

_Запрос:_

получить настройки: `{"type": "g_str", "data": {"key":"auth"}, "clOrdId": "1"}`;  
сохранить настройки: `{"type": "s_str", "data": {"key":"auth", "val":"123"}, "clOrdId": "1"}`;  
разрешить доступ по API: `{"type": "enable_api", "data": {"api": true}, "clOrdId": "1"}`;  
создать API ключ: `{"type": "api_key_create", "data": {}, "clOrdId": "1"}`.

_Ответ:_

```C
{"type": "callback", "data": {"key":"auth", "val":"123"},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"key":"API_KEY"},"clOrdId":"1", "ts":1646305072249112064, "result": "ok"}
{"type": "callback", "data": {"text":""},"clOrdId":"1", "ts":1646305072249112064, "result": "error"}
```

### **10.2.14. Статистика обработки тикетов**

_Запрос:_

запрос истории новых/открытых тикетов (только админ): `{"type": "g_tickets", "data":{"min_d": "2022-03-28", "max_d": "2022-04-27", "group":7}, "clOrdId": "1"}`.

`min_d` - минимальная дата (включительно) для получения статистики, далее от это даты будут группироваться "пачки" по group дней (для group=7, min_d рекомендуется всегда задавать понедельником);  
`max_d` - максимальная дата (НЕ включая) для получения статистики;  
`group` - количество дней для группировки статистики.

_Ответ:_

```C
{"type": "callback", "data":{"tickets":{"test@test.com":{"2022-03-28":{"not_solved":4, "created":3}, "2022-04-04":{"not_solved":3}}, "__summary__":{"2022-03-28":{"not_solved":4, "created":3}, "2022-04-04":{"not_solved":3}}}}, "ts":1651059246006788352, "clOrdId": "q0b", "result": "ok"}
```

`not_solved` - не решенных на конец периода группировки;  
`created` - новых за данный период группировки;  
`__summary__` - суммарные значения.
