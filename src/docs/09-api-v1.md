# **9. API**

## **9.1. Введение**

Кроме использования стандартного web-интерфейса для управления своими роботами предусмотрен доступ с помощью WebScoket API, используются текстовые сообщения в формате JSON. Такой вариант подходит для разработки собственного графического интерфейса управления роботами, а так же для сбора статистики.

## **9.2. Общие положения**

Сначала необходимо отправить сообщение с авторизацией. Если авторизация успешна - можно продолжать отправку других доступных сообщений, если нет - сервер закроет соединение.

Все сообщения, которые получает клиент, содержат поле ts - это время отправки сообщения в наносекундах в формате epoch.

Каждые 30 секунд сервер отправляет PING сообщение клиенту, если в течение 15-ти секунд сервер не получит от клиента PONG или любое другое сообщение, связь будет разорвана.

Максимальный допустимый размер входящего сообщения составляет 4МБ, при превышении данного лимита свзяь будет разорвана.

Можно отправлять не более 20-ти сообщений в секунду, при превышении лимита связь будет разорвана.

## **9.3. Куда подключаться**

Подключение по WebSocket, адрес wss://bot.fkviking.com/ws

## **9.4. Авторизация**

_Запрос:_

```C
{"type":"authorization_key", "data":{"key":"API_KEY", "email":"YOUR_EMAIL"}}
```

`key` - API ключ пользователя;  
`email` - адрес электронной почты пользователя.

_Ответ при успешной авторизации:_

```C
{"type":"authorization","data":{"code":0},"ts":1624516437000000123}
```

_Пример ошибки авторизации:_

```C
{"type": "text", "data": {"style": "error", "title": "Error", "text": "Wrong email"},"ts":1624516437000000123}
```

## **9.5. Получить всех роботов**

_Запрос:_

```C
{"type":"get_robots","clOrdId":"1","data":{}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет в ответе.

_Ответ:_

```C
{"type": "callback", "clOrdId": "1", "data": {"robots": [3]},"ts":1624516437000000123}
```

В атрибуте robots будут все id роботов пользователя.

## **9.6. Подписка на все транзакционные подключения робота**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"2","data":{"topic":"trans_conns","robot_id":"3"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота.

_Ответ (снапшот):_

```C
{"type": "callback", "clOrdId": "2", "data": {"trans_conns": [{"sec_type": 0, "name": "virtual", "full_name": "virtual", "trans_cnt": 0, "counter": 0, "use_in_mc": false, "sec_pos": null, "coin_pos": null, "speed_info": {"m0": 0, "m05": 0, "m1": 0, "m2": 0, "m4": 0, "m8": 0, "m16": 0, "l05a": 0, "l05d": 0, "l05m": 0, "l05ra": 0}, "stream_state": {"TRANS": 2}}, {"sec_type": 268435456, "name": "1", "full_name": "cryptofacilities_send_1", "trans_cnt": 0, "counter": 134, "use_in_mc": true, "sec_pos": {}, "coin_pos": {"f-eth:usd": {"pos": 8.8378071097}, "f-xbt:usd": {"pos": 4.8869037592}, "f-xrp:xbt": {"pos": 1.7e-09}}, "speed_info": {"m0": 0, "m05": 0, "m1": 0, "m2": 0, "m4": 0, "m8": 0, "m16": 0, "l05a": 0, "l05d": 0, "l05m": 0, "l05ra": 0}, "stream_state": {"Extra": 2, "Margin": 2, "Orders": 2, "Positions": 2, "Socket": 2, "Trades": 2}}], "snapshot": true},"ts":1624516437000000123}
```

`snapshot` - означает снапшот это или обновление.

_Обновления (приходит только ключ и то что обновилось):_

```C

{"type": "callback", "clOrdId": "2", "data": {"trans_conns": [{"sec_type": 268435456, "name": "1", "full_name": "cryptofacilities_send_1", "coin_pos": {"f-xbt:usd": {"pos": 4.8869037444}}}], "snapshot": false},"ts":1624516437000000123}
{"type": "callback", "clOrdId": "2", "data": {"trans_conns": [{"sec_type": 268435456, "name": "1", "full_name": "cryptofacilities_send_1", "speed_info": {"m0": 2, "m05": 2, "m1": 2, "m2": 2, "m4": 2, "m8": 2, "m16": 2, "l05a": 0, "l05d": 0, "l05m": 0, "l05ra": 2, "avg": 348292, "avga": 0, "avgd": 0, "avgm": 0, "avgra": 348292}}], "snapshot": false},"ts":1624516437000000123}
```

формат сообщения такой же, как у снапшота.

## **9.7. Подписка на конкретное транзакционное подключение робота**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"3","data":{"topic":"trans_conns","name":"1","sec_type":268435456,"robot_id":"3"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота;  
`name` - имя подключения;  
`sec_type` - тип подключения (список ниже).

_Ответ (снапшот):_

```C
{"type": "callback", "clOrdId": "3", "data": {"trans_conns": [{"sec_type": 268435456, "name": "1", "full_name": "cryptofacilities_send_1", "trans_cnt": 0, "counter": 143, "use_in_mc": true, "sec_pos": {}, "coin_pos": {"f-eth:usd": {"pos": 8.8378071097}, "f-xbt:usd": {"pos": 4.8869015889}, "f-xrp:xbt": {"pos": 1.7e-09}}, "speed_info": {"m0": 0, "m05": 0, "m1": 0, "m2": 0, "m4": 0, "m8": 0, "m16": 0, "l05a": 0, "l05d": 0, "l05m": 0, "l05ra": 0}, "stream_state": {"Extra": 2, "Margin": 2, "Orders": 2, "Positions": 2, "Socket": 2, "Trades": 2}}], "snapshot": true},"ts":1624516437000000123}
```

`snapshot` - означает снапшот это или обновление.

_Обновления (приходит только ключ и то что обновилось):_

```C
{"type": "callback", "clOrdId": "3", "data": {"trans_conns": [{"sec_type": 268435456, "name": "1", "full_name": "cryptofacilities_send_1", "coin_pos": {"f-xbt:usd": {"pos": 4.8869015743}}}], "snapshot": false},"ts":1624516437000000123}
{"type": "callback", "clOrdId": "3", "data": {"trans_conns": [{"sec_type": 268435456, "name": "1", "full_name": "cryptofacilities_send_1", "speed_info": {"m0": 2, "m05": 2, "m1": 2, "m2": 2, "m4": 2, "m8": 2, "m16": 2, "l05a": 0, "l05d": 0, "l05m": 0, "l05ra": 2, "avg": 348292, "avga": 0, "avgd": 0, "avgm": 0, "avgra": 348292}}], "snapshot": false},"ts":1624516437000000123}
```

формат сообщения такой же, как у снапшота.

## **9.8. Подписка на все портфели робота**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"1","data":{"topic":"portfolios","robot_id":"3"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота.

_Ответ (снапшот):_

```C
{"type": "callback", "clOrdId": "1", "data": {"portfolios": {"qwe": {"_buy_time": 5, "_fin_res_time": 60, "_fin_res_val": 10, "_freq_count": 1000, "_freq_delta": 10, "_freq_type": 0, "_l_b_time": 10, "_l_s_time": 10, "_max_running_percent": 70, "_pos_time": 5, "_sell_time": 5, "all_free": 1, "buy_status": 0, "cur_day_month": 13, "decimals": 4, "hedge_after": -1, "log_level": 0, "max_not_hedged": 1, "portfolio_num": 0, "portfolio_type": 0, "price_type": 0, "return_first": 9, "sell_status": 0, "timer": 1, "type_trade": 0, "_pos_v": 1000, "mkt_volume": 100, "move_limits1_date": -1, "overlay": 0, "v_in_l": 1, "v_in_r": 1, "v_max": 1, "v_min": -1, "v_out_l": 1, "v_out_r": 1, "btnBuy": "", "btnMarket": "", "btnSell": "", "buy_tt": "", "color": "#FFFFFF", "comment": "123", "ext_field1_": "return 0;", "ext_field2_": "return 0;", "name": "qwe", "sell_tt": "", "trade_formula": "S["CEX_BTC_USD'"].bid;return 0;", "trading_tt": "can trade", "_buy_v": 10, "_fin_res_abs": 1000, "_l_b_val": 10, "_l_s_val": 10, "_sell_v": 10, "_too_much_n_h_portfolios": 100, "buy": 11354, "delta": 0, "ext_field1": 0, "ext_field2": 0, "fin_res": 210.7, "fin_res_wo_c": 210.7, "first_delta": 0, "k": 0, "k1": 0, "k2": 0, "lim_b": 0, "lim_s": 0, "opened": 11564.7, "opened_comission": 0, "percent": 100, "price_b": 0, "price_check": 10, "price_s": 0, "sell": 11329.2, "tp": 1, "_buy_en": false, "_fin_res_en": false, "_fin_res_stop": false, "_freq_en": false, "_l_b_en": false, "_l_b_stop": false, "_l_s_en": false, "_l_s_stop": false, "_max_running_en": false, "_pos_en": false, "_sell_en": false, "_too_much_n_h_en": false, "always_limits_timer": false, "custom_trade": false, "disabled": false, "equal_prices": false, "ext_formulas": false, "in_formulas": false, "is_fin_res_wo_c": false, "quote": false, "re_buy": false, "re_sell": false, "simply_first": false, "to0": false, "tt_only_stop": false, "use_tt": false, "virtual_0_pos": false, "securities": {"CEX_BTC_USD": {"all_free": 1, "comission_sign": 1, "count_type": 0, "decimals": 4, "depth_ob": 1, "leverage": 1, "ob_c_p_t": 1, "ob_t_p_t": 0, "on_buy": 1, "put": -1, "ratio_sign": 0, "ratio_type": 0, "timer": 60, "ban_period": 0, "count": 1, "max_trans_musec": 1, "pos": -1, "sec_type": 2147483648, "client_code": "virtual", "count_formula": "return 1;", "ratio_b_formula": "return 1;", "ratio_s_formula": "return 1;", "sec_board": "", "sec_code": "BTC-USD", "sec_key": "CEX_BTC_USD", "sec_key_subscr": "BTC-USD", "comission": 0, "d_pg": 2147483647, "fin_res_mult": 1, "k": 0, "k_sl": 0, "m_s": 0.1, "mc_level_close": 0, "mc_level_to0": 0, "percent_of_quantity": 100, "ratio": 1, "sl": 0, "tp": 1, "is_first": true, "maker": false, "mm": false, "move_limits": false, "move_limits1": false, "sle": true, "te": true}}, "timetable": [], "is_trading": false}}, "snapshot": true},"ts":1624516437000000123}
```

`snapshot` - означает снапшот это или обновление.

_Обновления (приходит только ключ, это имя портфеля и бумаги, и то что обновилось):_

```C
{"type": "callback", "clOrdId": "1", "data": {"portfolios": {"qwe": {"name": "qwe", "sell": 11322.5, "securities": {"CEX_BTC_USD": {"sec_key": "CEX_BTC_USD", "pos":1}}}}, "snapshot": false},"ts":1624516437000000123}
```

формат сообщения такой же, как у снапшота.

## **9.9. Подписка на конкретный портфель робота**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"3","data":{"topic":"portfolios","robot_id":"3","name":"qwe"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота;  
`name` - имя портфеля.

_Ответ (снапшот):_

```C
{"type": "callback", "clOrdId": "3", "data": {"portfolios": {"qwe": {"_buy_time": 5, "_fin_res_time": 60, "_fin_res_val": 10, "_freq_count": 1000, "_freq_delta": 10, "_freq_type": 0, "_l_b_time": 10, "_l_s_time": 10, "_max_running_percent": 70, "_pos_time": 5, "_sell_time": 5, "all_free": 1, "buy_status": 0, "cur_day_month": 13, "decimals": 4, "hedge_after": -1, "log_level": 0, "max_not_hedged": 1, "portfolio_num": 0, "portfolio_type": 0, "price_type": 0, "return_first": 9, "sell_status": 0, "timer": 1, "type_trade": 0, "_pos_v": 1000, "mkt_volume": 100, "move_limits1_date": -1, "overlay": 0, "v_in_l": 1, "v_in_r": 1, "v_max": 1, "v_min": -1, "v_out_l": 1, "v_out_r": 1, "btnBuy": "", "btnMarket": "", "btnSell": "", "buy_tt": "", "color": "#FFFFFF", "comment": "123", "ext_field1_": "return 0;", "ext_field2_": "return 0;", "name": "qwe", "sell_tt": "", "trade_formula": "S["CEX_BTC_USD'"].bid;return 0;", "trading_tt": "can trade", "_buy_v": 10, "_fin_res_abs": 1000, "_l_b_val": 10, "_l_s_val": 10, "_sell_v": 10, "_too_much_n_h_portfolios": 100, "buy": 11354, "delta": 0, "ext_field1": 0, "ext_field2": 0, "fin_res": 210.7, "fin_res_wo_c": 210.7, "first_delta": 0, "k": 0, "k1": 0, "k2": 0, "lim_b": 0, "lim_s": 0, "opened": 11564.7, "opened_comission": 0, "percent": 100, "price_b": 0, "price_check": 10, "price_s": 0, "sell": 11329.2, "tp": 1, "_buy_en": false, "_fin_res_en": false, "_fin_res_stop": false, "_freq_en": false, "_l_b_en": false, "_l_b_stop": false, "_l_s_en": false, "_l_s_stop": false, "_max_running_en": false, "_pos_en": false, "_sell_en": false, "_too_much_n_h_en": false, "always_limits_timer": false, "custom_trade": false, "disabled": false, "equal_prices": false, "ext_formulas": false, "in_formulas": false, "is_fin_res_wo_c": false, "quote": false, "re_buy": false, "re_sell": false, "simply_first": false, "to0": false, "tt_only_stop": false, "use_tt": false, "virtual_0_pos": false, "securities": {"CEX_BTC_USD": {"all_free": 1, "comission_sign": 1, "count_type": 0, "decimals": 4, "depth_ob": 1, "leverage": 1, "ob_c_p_t": 1, "ob_t_p_t": 0, "on_buy": 1, "put": -1, "ratio_sign": 0, "ratio_type": 0, "timer": 60, "ban_period": 0, "count": 1, "max_trans_musec": 1, "pos": -1, "sec_type": 2147483648, "client_code": "virtual", "count_formula": "return 1;", "ratio_b_formula": "return 1;", "ratio_s_formula": "return 1;", "sec_board": "", "sec_code": "BTC-USD", "sec_key": "CEX_BTC_USD", "sec_key_subscr": "BTC-USD", "comission": 0, "d_pg": 2147483647, "fin_res_mult": 1, "k": 0, "k_sl": 0, "m_s": 0.1, "mc_level_close": 0, "mc_level_to0": 0, "percent_of_quantity": 100, "ratio": 1, "sl": 0, "tp": 1, "is_first": true, "maker": false, "mm": false, "move_limits": false, "move_limits1": false, "sle": true, "te": true}}, "timetable": [], "is_trading": false}}, "snapshot": true},"ts":1624516437000000123}
```

`snapshot` - означает снапшот это или обновление.

_Обновления (приходит только ключ, это имя портфеля и бумаги, и то что обновилось):_

```C
{"type": "callback", "clOrdId": "3", "data": {"portfolios": {"qwe": {"name": "qwe", "sell": 11325.3, "buy": 11352.5, "fin_res_wo_c": 212.2, "fin_res": 212.2, "securities": {"CEX_BTC_USD": {"sec_key": "CEX_BTC_USD", "pos":1}}}}, "snapshot": false},"ts":1624516437000000123}
```

формат сообщения такой же, как у снапшота.

## **9.10. Изменение значения одного параметра портфеля**

_Запрос:_

```C
{"type":"portfolio_field","data":{"robot_id":"3","name":"qwe","f_name":"v_in_l","f_value":2}}
```

`f_name` - имя параметра;  
`f_value` - новое значение параметра.

_Ответ:_  
Ответ на это сообщение не предусмотрен, кроме ответа об ошибке. Но если вы подписаны на обновления по данному портфелю, то получите изменение данного поля:

```C
{"type": "callback", "clOrdId": "7", "data": {"portfolios": {"qwe": {"name": "qwe", "v_in_l": 2}}, "snapshot": false},"ts":1624516437000000123}
```

_Ошибка:_

```C
{"type": "text", "data": {"style": "error", "title": "Error", "text": "Invalid input value for integer field "v_in_left": -1 not in range [1,9007199254740991]"},"ts":1624516437000000123}
```

## **9.11. Изменение значения сразу нескольких параметров портфеля**

_Запрос:_

```C
{"type":"portfolio", "data":{"robot_id":"3", "portfolio":{"decimals":4, "_fin_res_en":true, "_fin_res_time":-12, "_fin_res_abs":1000, "_fin_res_val":10, "_fin_res_stop":false, "_l_s_en":false, "_l_s_time":10, "_l_s_val":10, "_l_s_stop":false, "_l_b_en":false, "_l_b_time":10, "_l_b_val":10, "_l_b_stop":false, "_sell_en":false, "_sell_time":5, "_sell_v":10, "_buy_en":false, "_buy_time":5, "_buy_v":10, "_max_running_en":false, "_max_running_percent":70, "_too_much_n_h_en":false, "_too_much_n_h_portfolios":100, "_pos_en":false, "_pos_time":5, "_pos_v":1000, "name":"qwe"}}}
```

_Ответ:_  
Ответ на это сообщение не предусмотрен, кроме ответа об ошибке (в случае ошибки не применится ничего). Но если вы подписаны на обновления по данному портфелю, то получите изменение всех измененных полей.

_Ошибка:_

```C
{"type": "text", "data": {"style": "error", "title": "Error", "text": "Invalid input value for integer field "Time (sec)": -12 not in range [0,86400]"},"ts":1624516437000000123}
```

## **9.12. Изменение значения сразу нескольких параметров бумаги портфеля**

_Запрос:_

```C
{"type":"sec_field", "data":{"robot_id":"3", "name":"qwe", "sname":"CEX_BTC_USD", "security":{"count_formula":"return 1;", "ratio_b_formula":"return 1;", "ratio_s_formula":"return 1;"}}}
```

`sname` - SecKey бумаги;  
`security` - словарь параметров бумаги и их значений.

_Ответ:_  
Ответ на это сообщение не предусмотрен, кроме ответа об ошибке (в случае ошибки не применится ничего). Но если вы подписаны на обновления по данному портфелю, то получите изменение всех измененных полей.

## **9.13. Добавление/удаление бумаг портфеля**

Чтобы добавить/удалить бумаги из портфеля, нужно прислать имя портфеля и новый список его бумаг, указав для них `sec_key`, `sec_key_subscr` и `sec_type` (также можно указать обновляемые параметры любой из бумаг), также обязательно указать `is_first` у одной из бумаг.

_Запрос:_

```C
{"type":"portfolio", "data":{"robot_id":"3", "portfolio":{"name":"qwe", "securities":{"CEX_BTC_USD":{"sec_type":2147483648, "sec_key":"CEX_BTC_USD", "sec_key_subscr":"BTC-USD", "is_first":true}}}}}
```

_Ответ:_  
Ответ на это сообщение не предусмотрен, кроме ответа об ошибке (в случае ошибки не применится ничего). Но если вы подписаны на обновления по данному портфелю, то получите изменение всех измененных полей.

## **9.14. Удаление портфеля**

Чтобы удалить портфель/портфели, нужно отправить сообщение вида, описанного ниже (здесь P1, P2 - имена портфелей для удаления).

_Запрос:_

```C
{"type":"vector","data":[{"type":"action","data":{"robot_id":"1","action":"del_portfolio","params":{"name":"P1"}}},{"type":"action","data":{"robot_id":"1","action":"del_portfolio","params":{"name":"P2"}}}]}
```

_Ответ:_  
Ответ на это сообщение не предусмотрен, кроме ответа об ошибке, но если вы подписаны на обновления по данному портфелю, то получите обновление вида:

```C
{"type": "callback", "clOrdId": "1", "data": {"portfolios": {"P1": {"name": "P1", "__action": "del"}}, "snapshot": false},"ts":1625041350069746688}
```

## **9.15. Подписка на таблицу финансовых результатов (раздвижки)**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"1","data":{"topic":"trades","robot_id":"3"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота.

_Ответ (снапшот, приходят последние 5000 записей):_

```C
{"type": "callback", "clOrdId": "1", "data": {"trades": [{"time": 1571923847981999080, "is_sl": false, "name": "qwe2", "price": 7468.5, "buy_sell": 2, "quantity": 1, "tt": "CEX_BTC_USD: SELL quantity=1, price=7468.5000, oNo=3, at 17:30:47", "decimals": 4, "id": 4042437680275238758}, {"time": 1571923836000529003, "is_sl": true, "name": "qwe2", "price": 7476.2, "buy_sell": 1, "quantity": 1, "tt": "CEX_BTC_USD: BUY quantity=1, price=7476.2000, oNo=2, at 17:30:36", "decimals": 4, "id": -3389679118170958657}], "snapshot": true},"ts":1624516437000000123}
```

`trades` - список раздвижек;  
`time` - дата/время в формате epoch в наносекундах;  
`is_sl` - заявки были переставлены по стоп-лосс;  
`buy_sell` - направление, 1 - покупка, 2 - продажа;  
`quantity` - количество в штуках портфелей (всегда целое);  
`tt` - всплывающая подсказка со списком сделок;  
`decimals` - сколько знаков после запятой отображать в цене (price);
`name` - имя портфеля;  
`snapshot` - означает снапшот это или обновление.

_Обновления:_  
формат сообщения такой же, как у снапшота, приходят новые раздвижки (обновлений по старым раздвижкам не бывает).

## **9.16. Подписка на таблицу всех сделок**

_Подписка:_

```C
{"type":"subscribe","clOrdId":"2","data":{"topic":"deals","robot_id":"3"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота.

_Ответ (снапшот, приходят последние 5000 записей):_

```C
{"type": "callback", "clOrdId": "2", "data": {"deals": [{"time": 1571923847981993828, "ono": 3, "sec": "CEX_BTC_USD", "name": "qwe2", "price": 7468.5, "buy_sell": 2, "quantity": 1, "decimals": 4, "id": -4195816474436969915}, {"time": 1571923836000518880, "ono": 2, "sec": "CEX_BTC_USD", "name": "qwe2", "price": 7476.2, "buy_sell": 1, "quantity": 1, "decimals": 4, "id": -324815817002964722}, {"time": 1571819580259371838, "ono": 5863, "sec": "BN_ADABTC", "name": "bin1", "price": 4.76e-06, "buy_sell": 2, "quantity": 10000000000, "decimals": 8, "id": 3452938594962378336}], "snapshot": true},"ts":1624516437000000123}
```

`deals` - список сделок;  
`time` - дата/время в формате epoch в наносекундах;  
`id` - уникальный идентификатор записи;  
`ono` - номер заявки;  
`buy_sell` - направление, 1 - покупка, 2 - продажа;  
`decimals` - сколько знаков после запятой отображать в цене (price);  
`sec` - уникальный идентификатор бумаги;  
`name` - имя портфеля;  
`snapshot` - означает снапшот это или обновление.

_Обновления:_  
формат сообщения такой же, как у снапшота, приходят новые сделки (обновлений по старым сделкам на бывает).

## **9.17. Получение исторических сделок**

_Запрос:_

```C
{"type":"subscribe","clOrdId":"2","data":{"topic":"deals","robot_id":"3", "from":"2020/01/01 09:49", "to":"2020/01/02 09:49", "name": "test"}}
```

`clOrdId` - пользовательский идентификатор сообщения, он же придет во всех ответах;  
`robot_id` - id-робота;  
`from` - дата начала, включительно;  
`to` - дата окончания, включительно;  
`name` - имя портфеля (если не указано, то по всем портфелям).

_Ответ (приходит не более 10000 записей):_

```C
{"type": "callback", "clOrdId": "2", "data": {"deals": [{"time": 1571923847981993828, "ono": 3, "sec": "CEX_BTC_USD", "name": "qwe2", "price": 7468.5, "buy_sell": 2, "quantity": 1, "decimals": 4, "id": -4195816474436969915}, {"time": 1571923836000518880, "ono": 2, "sec": "CEX_BTC_USD", "name": "qwe2", "price": 7476.2, "buy_sell": 1, "quantity": 1, "decimals": 4, "id": -324815817002964722}, {"time": 1571819580259371838, "ono": 5863, "sec": "BN_ADABTC", "name": "bin1", "price": 4.76e-06, "buy_sell": 2, "quantity": 10000000000, "decimals": 8, "id": 3452938594962378336}], "snapshot": true},"ts":1624516437000000123}
```

`deals` - список сделок;  
`time` - дата/время в формате epoch в наносекундах;  
`id` - уникальный идентификатор записи;  
`ono` - номер заявки;  
`buy_sell` - направление, 1 - покупка, 2 - продажа;  
`decimals` - сколько знаков после запятой отображать в цене (price);  
`sec` - уникальный идентификатор бумаги;  
`name` - имя портфеля;  
`snapshot` - означает снапшот это или обновление, всегда true.

## **9.18. Включить/выключить все формулы портфеля/портфелей**

_Запросы:_

```C
{"type":"action","data":{"robot_id":"1","action":"formulas_start","params":{"name":"p1"}}}
```

включить формулы для заданного портфеля.

```C
{"type":"action","data":{"robot_id":"1","action":"formulas_stop","params":{"name":"p1"}}}
```

выключить формулы для заданного портфеля.

```C
{"type":"vector","data":[{"type":"action","data":{"robot_id":"1","action":"formulas_start","params":{"name":"p1"}}},{"type":"action","data":{"robot_id":"1","action":"formulas_start","params":{"name":"p2"}}}]}
```

включить формулы для заданных портфелей.

```C
{"type":"vector","data":[{"type":"action","data":{"robot_id":"1","action":"formulas_stop","params":{"name":"p1"}}},{"type":"action","data":{"robot_id":"1","action":"formulas_stop","params":{"name":"p2"}}}]}
```

выключить формулы для заданных портфелей.

_Ответ:_  
Ответ на это сообщение не предусмотрен, кроме ответа об ошибке.

## **9.19. Отписка**

Для отписки нужно то же самое сообщение, что и при подписке, но с `type` равным `unsubscribe`. Либо закрыть соединение.

## **9.20. Отправка нескольких сообщений одной "пачкой"**

В списке _data_ вы можете указывать любые сообщения, описанные выше.

_Общий вид запроса:_

```C
{"type":"vector","data":[]}
```

_Пример запроса:_

```C
{"type":"vector","data":[{"type":"action","data":{"robot_id":"1","action":"formulas_start","params":{"name":"p1"}}},{"type":"subscribe","clOrdId":"2","data":{"topic":"deals","robot_id":"3"}}]}
```

_Ответ:_  
Вы получите ответы на каждый из запросов из списка data, на который ответ предусмотрен.

## **9.21. Словарь пользовательских параметров**

Для отправки пользовательских параметров в робот вы можете использовать поле `__extra`, `__extra` является словарем, его ключи - строковые представления целых чисел из отрезка [0, 29], значения - дробные числа. Данный словарь может быть использован в C++ интерфейсе через метод портфеля `extra()`. Для удаления ключа из словаря, необходимо задать его значение равным нулю.

_Пример добавление/обновления по ключу:_

```C
{"type":"portfolio_field","data":{"robot_id":"3","name":"qwe","f_name":"__extra","f_value":{"2":12.34}}}
```

_Пример удаления по ключу:_

```C
{"type":"portfolio_field","data":{"robot_id":"3","name":"qwe","f_name":"__extra","f_value":{"2":0}}}
```

_Ответ:_  
Ответ на это сообщение не предусмотрен, кроме ответа об ошибке. Но если Вы подписаны на обновления по данному портфелю, то получите изменение данного поля, при удалении ключа, вы получите в качестве значения удаляемого ключа {"__action":"del"}.

## **9.22. Список sec_type**

ANY = 0  
MOEX_OPT = 1  
MOEX_FUT = (1 << 1)  
MOEX_FUT_OPT = (1) + (1 << 1)  
MOEX_FOND = (1 << 2)  
MOEX_CURR = (1 << 3)  
MOEX_FOND_CURR = (1 << 2) + (1 << 3)  
EXANTE = (1 << 4)  
SPB = (1 << 5)  
KASE = (1 << 6)  
EBS = (1 << 7)  
FEEDOS = (1 << 8)  
CQG = (1 << 11)  
CQG_EXANTE = (1 << 11) + (1 << 4)  
HUOBIFUTCM = (1 << 12)  
KRAKEN = (1 << 16)  
HUOBIFUTUM = (1 << 17)  
BITFINEX = (1 << 18)  
HITBTC = (1 << 19)  
BITMEX = (1 << 20)  
BINANCEOPT = (1 << 21)  
BINANCE = (1 << 22)  
GDAX = (1 << 23)  
GLOBITEX = (1 << 24)  
DERIBIT = (1 << 25)  
OKEX = (1 << 26)  
BEQUANT = (1 << 27)  
KRAKENFUT = (1 << 28)  
KUCOIN = (1 << 29)  
CEXIO = (1 << 31)  
HUOBI = (1 << 32)  
HBDM = (1 << 33)  
PRIZMBIT = (1 << 34)  
BINANCEFUT = (1 << 35)  
XENA = (1 << 40)  
VIKINGTRADE = (1 << 41)  
BINANCECM = (1 << 42)  

где 1 << N, это 2 в степени N.
