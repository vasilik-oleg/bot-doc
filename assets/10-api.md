---
title: 10.API фронта 2.0
section: 10
---

# API фронта 2.0
<style scoped>
table {
  font-size: 13px;
}
summary {
padding:5px 0px 5px 0px;
}
</style>

## Общие положения

### Куда подключаться

Адрес подключения к API `wss://bot.fkviking.com/ws`

### Механизм поддержания связи с сервером

Клиентская сессия длится не более 12-ти часов, любое клиентское соединение будет закрыто не позже, чем через 12 часов после того, как было установлено. Для продолжения работы соединение необходимо установить заново

Если клиент не отправляет сообщения в течение 5-ти секунд, соединение будет закрыто сервером

Для поддержания связи с сервером и для определения статуса соеденения с сервером в случае отсутствия исходящих сообщений от клиента в течение 5-ти секунд предполагается отправлять служебное сообщение в виде строки, состоящей из
одного символа `7`, в ответ сервер пришлет ту же строку. Если сервер не пришлет данную строку в течение 3-ех секунд, клиент должен переподключиться. Вместо строки с символом `7` клиент может отправлять ping фрейм, тогда в ответ
сервер ответит pong фреймом

### Размер входящих и исходящих сообщений, группировка и сжатие сообщений

Максимальный размер сообщения, отправляемого клиентом, должен быть меньше 1048576 байт

Размер сообщений, отправляемых сервером, до их сжатия не превосходит 200 КБ. Если размер сообщения, отправлемого сервером, до его сжатия превышает 100 КБ, сообщение будет заархивировано и отправлено не как текстовое, а
уже как бинарное сообщение. Сжатие сообщений производится при помощи библиотеки `zlib` c параметром `wbits = 15`

Клиент, так же как и сервер, может сжимать свои исходящие сообщения тем же методом, что и сервер

Для уменьшения числа отправляемых сервером отдельных сообщений предусмотрен механизм группировки сообщений. В данном случае все отдельные JSON сообщения, представляющие собой словари (т.е. все сообщения кроме pong фреймов и `7`),
будут сложены в список и отправлены одним большим JSON сообщением. Клиент, получивший список от сервера, должен обработать каждое сообщение списка в отдельности. Возможность получения групп сообщений задается клиентом на
этапе авторизации. Если сервер отправляет сообщения группой большого размера, то сервер сожмет всю группу, а не каждое отдельное сообщение в группе

Клиент, так же как и сервер, может группировать свои исходящие сообщения в списки (кроме ping фрейма и `7`), список это всего лишь обертка, сервер обработает каждое сообщение из списка в отдельности. Группировка сообщений помогает
увеличить число отправлемых клиентом сообщений, чтобы не попасть на rate limit. Максимальный размер группы, которую может отправить клиент, состоит из 50-ти сообщений, при превышении данного значения соединение с клиентом будет закрыто.
Если клиент отправляет сообщения группой большого размера, то рекомендуется эту группу сжать, сжимать нужно именно группу, а не каждое отдельное сообщение в группе

### Rate limits

Rate limit считается для каждой вебсокет сессии в отдельности. Каждое сообщение имеет свой вес (в неких пунктах), вы можете отправить сообщения суммарным весом не более 10000 пунктов за последние 10 секунд. Суммарный доступный вес сообщений
пересчитывается каждую секунду (отбрасывается суммарный набранный вес за самую старую секунду из десяти). Сообщения имеют разный вес, ping фрейм и `7` имеют вес 1 пункт, все остальные сообщения имеют вес 49 пунктов, группа сообщений (т.е.
сообщения упакованные в один список) имеет вес 49 пунктов. Т.о. за 10 секунд клиент может отправить примерно $10000 \div 49 = 204$ сообщений, можно все сообщения отправить и за одну секунду, но тогда в следующие 9 секунд слать будет нечего и
связь будет закрыта либо по таймауту (он был описан выше и равен 5 секунд), либо, если клиент таки отправит сообщение, то по rate limit-у. При превышении rate limit-а связь закрывается автоматически

С одного ip-адреса разрешается не более 20-ти попыток подключения в течение минуты, при превышении данного значения соединение перестанет устанавливаться, в ответ будет отправлен код 429

### Прочее

Во всех подписках в рамках одной вебсокет сессии в рамках одного и того же `type` требуется уникальный `eid` для текущих подписок (можно отписаться и снова подписаться с тем же `eid`, но одновременно нельзя иметь две и более подписок
на одни и те же `type` и `eid`)

Порядок ответа на входящие сообщения сервером не определен. Чтобы быть уверенным, что сообщения будут обработаны в заданном порядке, необходимо слать следующее сообщение только после получения ответа на предыдущее. В связи с этим
рекомендуется вначале дождаться ответа на запрос авторизации и только потом слать серверу какие-либо другие команды (иначе получите ошибку `Not authorized`)

## Авторизация

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = authorization_key | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > email | y | string |  | User email |
| > key | y | string |  | User API key (API usage should be enabled) |
| > role | n | string |  | User role, default value is demo |
| > group | n | boolean |  | Receive messages from server in groups, default value is false |
| > compress | n | boolean |  | Compress large size messages by server, default value is true. *It is strongly recommended to turn off compression only for debugging purposes!* |

Example:

```json
{
	"type":"authorization_key",
	"data":
	{
		"email":"qwd@gmail.com",
		"key":"asdcccccccccccccccc",
		"role":"demo",
		"group":false,
		"compress":true
	},
	"eid":"qwe"
}
```
</details>    
<details>

<summary>Response on success</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = authorization_key | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > e | y | string |  | User email |
| > lang | y | string |  | User lang, always `en` |
| > active_role | y | string |  | current user role |
| > roles | y | array |  | Array of available user roles |
| >> [] | y | string |  | Available user role |

Example:

```json
{
	"type":"authorization_key",
	"data":
	{
		"e":"test@test.com",
		"lang":"en",
		"active_role":"trader",
		"roles":["demo", "trader"]
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669793958010491759
}
```
</details>    
   
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = authorization_key | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"authorization_key",
	"data":
	{
		"msg":"User not found",
		"code":8
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>


## Портфели

### Подписка на список доступных портфелей <Anchor :ids="['подписка-на-список-доступных-портфелей']" />

При добавлении/удалении портфеля/доступа к портфелю будут высланы обновления

В любой момент может быть выслан снапшот

Обновления значений пользовательских полей `uf0, ..., uf19` содержат только те ключи каждого из пользовательских полей, чьи значения были изменены

При отзыве доступа к портфелю, если вы подписаны на этот портфель, вы получите сообщение об отписке

<details>
<summary>Subscription request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | n | object |  |  |

Example:

```json
{
	"type": "available_portfolio_list.subscribe",
	"data": {},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > portfolios_add | y | array |  | Array of available portfolios |
| >> [] | y | [string, string, string] | portfolio_id | Portfolio ID (robot ID and portfolio name) and portfolio owner (creator)|
|  |  |  |  |  |

Example:

```json
{
	"type":"available_portfolio_list.subscribe",
	"data":
	{
		"portfolios_add":
		[
			["1","test","test@mail.ru"],
			["1","test1","test@mail.ru"],
			["1","test2","test@mail.ru"],
			["1","test3","test@mail.ru"]
		]
	},
	"r":"s",
	"eid":"qwerty",
	"ts":1669793958010491759
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > portfolios_add | n | array |  | Array of newly available portfolios |
| >> [] |  | [string, string, string] | portfolio_id | Portfolio ID (robot ID and portfolio name) and portfolio owner (creator)|
| > portfolios_del | n | array |  | Array of portfolios with revoked access |
| >> [] |  | [string, string, string] | portfolio_id | Portfolio ID (robot ID and portfolio name) and portfolio owner (creator)|

Example:

```json
{
	"type":"available_portfolio_list.subscribe",
	"data":
	{
		"portfolios_del":
		[
			["1","test","test@mail.ru"]
		]
	},
	"r":"u",
	"eid":"qwerty",
	"ts":1669793958010491759
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"available_portfolio_list.subscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от списка доступных портфелей

Отписаться от событий по списку доступных портфелей

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"available_portfolio_list.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"available_portfolio_list.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"available_portfolio_list.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Получить список доступных портфелей с включенной записью истории <Anchor :ids="['get-portfolios-history']" />

<details>
<summary>Subscription</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.get_with_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | n | object |  |  |

Example:

```json
{
	"type": "available_portfolio_list.get_with_history",
	"data": {},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.get_with_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > portfolios | y | array |  | Array of available portfolios |
| >> [] | y | [string, string, string] | portfolio_id | Portfolio ID (robot ID and portfolio name) and portfolio owner (creator)|
|  |  |  |  |  |

Example:

```json
{
	"type":"available_portfolio_list.get_with_history",
	"data":
	{
		"portfolios":
		[
			["1","test","test@mail.ru"],
			["1","test1","test@mail.ru"],
			["1","test2","test@mail.ru"],
			["1","test3","test@mail.ru"]
		]
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669793958010491759
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_portfolio_list.get_with_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"available_portfolio_list.get_with_history",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>   

### Добавить портфель

Добавить портфель в робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.add_portfolio | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > portfolio | y | object |  | Portfolio |
| >> name | y | string |  | Portfolio name |
| >> * | n | * |  | Other portfolio fields from template |
| >> securities | y | object |  | Securities |
| >>> SEC_KEY | y | string: object |  | Security object key |
| >>>> sec_key | y | string |  | Security unique key (should be equal to SEC_KEY) |
| >>>> sec_type | y | number | sec_type | Security exchange/connection type |
| >>>> sec_key_subscr | y | string |  | Security key on the exchange |
| >>>> sec_board | y | string |  | Security board |
| >>>> sec_code | y | string |  | Security code |
| >>>> is_first | y | boolean |  | “Is first” security of the portfolio |
| >>>> * | n | * |  | Other security fields from template |

Example:

```json
{
    "type": "robot.add_portfolio",
    "data": {
        "r_id": "1",
        "portfolio": {
            "k": 0,
            "k1": 0,
            "k2": 0,
            "tp": 1,
            "pos": 0,
            "to0": false,
            "name": "test3",
            "color": "#FFFFFF",
            "delta": 0,
            "lim_b": 0,
            "lim_s": 0,
            "quote": false,
            "timer": 1,
            "v_max": 1,
            "v_min": -1,
            "_buy_v": 10,
            "_pos_v": 1000,
            "opened": 0,
            "re_buy": false,
            "use_tt": false,
            "v_in_l": 1,
            "v_in_r": 1,
            "_buy_en": false,
            "_l_b_en": false,
            "_l_s_en": false,
            "_pos_en": false,
            "_sell_v": 10,
            "comment": "",
            "overlay": 0,
            "percent": 100,
            "re_sell": false,
            "v_out_l": 1,
            "v_out_r": 1,
            "_l_b_val": 10,
            "_l_s_val": 10,
            "_sell_en": false,
            "decimals": 4,
            "disabled": false,
            "_buy_time": 5,
            "_l_b_stop": false,
            "_l_b_time": 10,
            "_l_s_stop": false,
            "_l_s_time": 10,
            "_pos_time": 5,
            "log_level": 0,
            "timetable": [
                {
                    "begin": 36000,
                    "end": 50400,
                    "auto_close": false,
                    "auto_to_market": true,
                    "auto_to0": false
                },
                {
                    "begin": 50580,
                    "end": 67020,
                    "auto_close": false,
                    "auto_to_market": true,
                    "auto_to0": false
                }
            ],
            "_sell_time": 5,
            "mkt_volume": 100,
            "price_type": 0,
            "securities": {
                "OKF_ADA_USDT_SWAP": {
                    "k": 0,
                    "mm": false,
                    "sl": 0,
                    "te": true,
                    "tp": 1,
                    "pos": 0,
                    "sle": false,
                    "k_sl": 0,
                    "count": 1,
                    "maker": false,
                    "ratio": 1,
                    "timer": 60,
                    "on_buy": 1,
                    "sec_key": "OKF_ADA_USDT_SWAP",
                    "decimals": 4,
                    "depth_ob": 1,
                    "is_first": true,
                    "leverage": 1,
                    "ob_c_p_t": 1,
                    "ob_t_p_t": 0,
                    "sec_type": 67108864,
                    "comission": 0,
                    "ban_period": 1,
                    "count_type": 0,
                    "ratio_sign": 0,
                    "ratio_type": 0,
                    "client_code": "virtual",
                    "move_limits": false,
                    "fin_res_mult": 1,
                    "mc_level_to0": 0,
                    "move_limits1": false,
                    "count_formula": "return 1;",
                    "comission_sign": 1,
                    "mc_level_close": 0,
                    "sec_key_subscr": "ADA-USDT-SWAP",
                    "max_trans_musec": 1000000,
                    "ratio_b_formula": "return 1;",
                    "ratio_s_formula": "return 1;",
                    "percent_of_quantity": 100
                }
            },
            "type_trade": 0,
            "_fin_res_en": false,
            "ext_field1_": "return 0;",
            "ext_field2_": "return 0;",
            "first_delta": 0,
            "hedge_after": 1,
            "n_perc_fill": 0,
            "price_check": 10,
            "_fin_res_abs": 1000,
            "_fin_res_val": 10,
            "custom_trade": false,
            "equal_prices": false,
            "ext_formulas": false,
            "simply_first": false,
            "_fin_res_stop": false,
            "_fin_res_time": 60,
            "cur_day_month": 7,
            "portfolio_num": 0,
            "trade_formula": "return 0;",
            "virtual_0_pos": false,
            "max_not_hedged": 1,
            "portfolio_type": 0,
            "_max_running_en": false,
            "_too_much_n_h_en": false,
            "opened_comission": 0,
            "move_limits1_date": -1,
            "always_limits_timer": false,
            "_max_running_percent": 70
        }
    },
    "eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.add_portfolio | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type":"robot.add_portfolio",
	"data":
	{
		"r_id":"1",
		"p_id":"test3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.add_portfolio | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.add_portfolio",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Изменить портфель

Изменить значение/значения полей портфеля/бумаг портфеля

Если указан ключ *securities*, то в нем обязательно необходимо указать весь текущий список бумаг портфеля с их обязательными полями, а также можно указать поля, необходимые для изменения

Значения пользовательских полей `uf0, ..., uf19` являются словарями, можно изменить значение как по одному из ключей, так и сразу по обоим ключам

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > portfolio | y | object |  | Portfolio |
| >> name | y | string |  | Portfolio name |
| >> * | n | * |  | Other portfolio fields from template |
| >> securities | n | object |  | Securities |
| >>> SEC_KEY | n | string: object |  | Security object key |
| >>>> sec_key | y | string |  | Security unique key (should be equal to SEC_KEY) |
| >>>> sec_type | y | number | sec_type | Security exchange/connection type |
| >>>> sec_key_subscr | y | string |  | Security key on the exchange |
| >>>> sec_board | y | string |  | Security board |
| >>>> sec_code | y | string |  | Security code |
| >>>> is_first | n | boolean |  | “Is first” security of the portfolio |
| >>>> * | n | * |  | Other security fields from template |

Example:

```json
{
    "type": "portfolio.update",
    "data": {
        "r_id": "1",
        "portfolio": {
            "k": 0,
            "k1": 0,
            "k2": 0,
            "tp": 1,
            "pos": 0,
            "to0": false,
            "name": "test3",
            "color": "#FFFFFF",
            "delta": 0,
            "lim_b": 0,
            "lim_s": 0,
            "quote": false,
            "timer": 1,
            "v_max": 1,
            "v_min": -1,
            "_buy_v": 10,
            "_pos_v": 1000,
            "opened": 0,
            "re_buy": false,
            "use_tt": false,
            "v_in_l": 1,
            "v_in_r": 1,
            "_buy_en": false,
            "_l_b_en": false,
            "_l_s_en": false,
            "_pos_en": false,
            "_sell_v": 10,
            "comment": "",
            "overlay": 0,
            "percent": 100,
            "re_sell": false,
            "v_out_l": 1,
            "v_out_r": 1,
            "_l_b_val": 10,
            "_l_s_val": 10,
            "_sell_en": false,
            "decimals": 4,
            "disabled": false,
            "_buy_time": 5,
            "_l_b_stop": false,
            "_l_b_time": 10,
            "_l_s_stop": false,
            "_l_s_time": 10,
            "_pos_time": 5,
            "log_level": 0,
            "timetable": [
                {
                    "begin": 36000,
                    "end": 50400,
                    "auto_close": false,
                    "auto_to_market": true,
                    "auto_to0": false
                },
                {
                    "begin": 50580,
                    "end": 67020,
                    "auto_close": false,
                    "auto_to_market": true,
                    "auto_to0": false
                }
            ],
            "_sell_time": 5,
            "mkt_volume": 100,
            "price_type": 0,
            "securities": {
                "OKF_ADA_USDT_SWAP": {
                    "k": 0,
                    "mm": false,
                    "sl": 0,
                    "te": true,
                    "tp": 1,
                    "pos": 0,
                    "sle": false,
                    "k_sl": 0,
                    "count": 1,
                    "maker": false,
                    "ratio": 1,
                    "timer": 60,
                    "on_buy": 1,
                    "sec_key": "OKF_ADA_USDT_SWAP",
                    "decimals": 4,
                    "depth_ob": 1,
                    "is_first": true,
                    "leverage": 1,
                    "ob_c_p_t": 1,
                    "ob_t_p_t": 0,
                    "sec_type": 67108864,
                    "comission": 0,
                    "ban_period": 1,
                    "count_type": 0,
                    "ratio_sign": 0,
                    "ratio_type": 0,
                    "client_code": "virtual",
                    "move_limits": false,
                    "fin_res_mult": 1,
                    "mc_level_to0": 0,
                    "move_limits1": false,
                    "count_formula": "return 1;",
                    "comission_sign": 1,
                    "mc_level_close": 0,
                    "sec_key_subscr": "ADA-USDT-SWAP",
                    "max_trans_musec": 1000000,
                    "ratio_b_formula": "return 1;",
                    "ratio_s_formula": "return 1;",
                    "percent_of_quantity": 100
                }
            },
            "type_trade": 0,
            "_fin_res_en": false,
            "ext_field1_": "return 0;",
            "ext_field2_": "return 0;",
            "first_delta": 0,
            "hedge_after": 1,
            "n_perc_fill": 0,
            "price_check": 10,
            "_fin_res_abs": 1000,
            "_fin_res_val": 10,
            "custom_trade": false,
            "equal_prices": false,
            "ext_formulas": false,
            "simply_first": false,
            "_fin_res_stop": false,
            "_fin_res_time": 60,
            "cur_day_month": 7,
            "portfolio_num": 0,
            "trade_formula": "return 0;",
            "virtual_0_pos": false,
            "max_not_hedged": 1,
            "portfolio_type": 0,
            "_max_running_en": false,
            "_too_much_n_h_en": false,
            "opened_comission": 0,
            "move_limits1_date": -1,
            "always_limits_timer": false,
            "_max_running_percent": 70
        }
    },
    "eid": "qwerty"
}
```

```json
{
	"type":"portfolio.update",
	"data":
	{
		"r_id":"9901",
		"portfolio":
		{
			"name":"DerCry_view_only",
			"uf0":
			{
				"v":123
			}
		},
	}
	"eid":"1146"
}
```

```json
{
	"type":"portfolio.update",
	"data":
	{
		"r_id":"9901",
		"portfolio":
		{
			"name":"DerCry_view_only",
			"uf2":
			{
				"v":1,
				"c":"qwe"
			}
		},
	}
	"eid":"1146"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type":"portfolio.update",
	"data":
	{
		"r_id":"1",
		"p_id":"test3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.update",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Удалить портфель

Удалить портфель из робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.remove | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio.remove",
	"data": {
		"r_id": "1",
		"p_id": "test"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.remove | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio.remove",
	"data": {
		"r_id": "1",
		"p_id": "test"
	},
	"ts":1657693572940145200,
	"eid": "qwerty",
	"r": "p"
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.remove | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.remove",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Подписка на портфель

Подписаться на события изменения/удаления полей портфеля/бумаг портфеля

В любой момент может быть выслан снапшот

В обновлениях придут ключи (для портфеля — это name, для обновленных бумаг — sec_key) и измененные поля портфеля/бумаги портфеля

При удалении портфеля/бумаги портфеля придет поле __action=del

При удалении портфеля вы будете от него отписаны

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio.subscribe",
	"data": {
		"r_id": "1",
		"p_id": "test3"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > value | y | object |  | Portfolio snapshot |
| >> name | y | string |  | Portfolio name |
| >> * | y | * |  | Other portfolio fields from template |
| >> securities | y | object |  | Securities |
| >>> SEC_KEY | y | string: object |  | Security object key |
| >>>> sec_key | y | string |  | Security unique key (should be equal to SEC_KEY) |
| >>>> * | y | * |  | Other security fields from template |

Example:

```json
{
    "type": "portfolio.subscribe",
    "data": {
        "r_id": "1",
        "p_id": "test3",
        "value": {
            "name": "test3",
            "owner": "test@gmail.com",
            "securities": {
                "OKF_ADA_USDT_SWAP": {
                    "all_free": 1,
                    "comission_sign": 1,
                    "count_type": 0,
                    "decimals": 4,
                    "depth_ob": 1,
                    "leverage": 1,
                    "ob_c_p_t": 1,
                    "ob_t_p_t": 0,
                    "on_buy": 1,
                    "put": -1,
                    "ratio_sign": 0,
                    "ratio_type": 0,
                    "timer": 60,
                    "ban_period": 1,
                    "count": 1,
                    "max_trans_musec": 1000000,
                    "old_pos": 0,
                    "pos": 0,
                    "sec_type": 67108864,
                    "client_code": "virtual",
                    "count_formula": "return 1;",
                    "ratio_b_formula": "return 1;",
                    "ratio_s_formula": "return 1;",
                    "sec_board": "",
                    "sec_code": "",
                    "sec_key": "OKF_ADA_USDT_SWAP",
                    "sec_key_subscr": "ADA-USDT-SWAP",
                    "comission": 0,
                    "d_pg": 2147483647,
                    "fin_res_mult": 1,
                    "k": 0,
                    "k_sl": 0,
                    "mc_level_close": 0,
                    "mc_level_to0": 0,
                    "percent_of_quantity": 100,
                    "ratio": 1,
                    "sl": 0,
                    "tp": 1,
                    "is_first": true,
                    "maker": false,
                    "mm": false,
                    "move_limits": false,
                    "move_limits1": false,
                    "sle": false,
                    "te": true
                }
            },
            "_buy_time": 5,
            "_fin_res_time": 60,
            "_fin_res_val": 10,
            "_freq_count": 1000,
            "_freq_delta": 10,
            "_freq_type": 0,
            "_l_b_time": 10,
            "_l_s_time": 10,
            "_max_running_percent": 70,
            "_pos_time": 5,
            "_sell_time": 5,
            "all_free": 1,
            "buy_status": 0,
            "cur_day_month": 30,
            "decimals": 4,
            "hedge_after": 1,
            "log_level": 0,
            "max_not_hedged": 1,
            "n_perc_fill": 0,
            "portfolio_num": 0,
            "portfolio_type": 0,
            "price_type": 0,
            "sell_status": 0,
            "timer": 1,
            "type_trade": 0,
            "_pos_v": 1000,
            "mkt_volume": 100,
            "move_limits1_date": -1,
            "overlay": 0,
            "pos": 0,
            "return_first": 0,
            "v_in_l": 1,
            "v_in_r": 1,
            "v_max": 1,
            "v_min": -1,
            "v_out_l": 1,
            "v_out_r": 1,
            "btnBuy": "",
            "btnMarket": "",
            "btnSell": "",
            "buy_tt": "",
            "color": "#FFFFFF",
            "comment": "",
            "ext_field1_": "return 0;",
            "ext_field2_": "return 0;",
            "sell_tt": "",
            "trade_formula": "return 0;",
            "trading_tt": "can trade",
            "_buy_v": 10,
            "_fin_res_abs": 1000,
            "_l_b_val": 10,
            "_l_s_val": 10,
            "_sell_v": 10,
            "_too_much_n_h_portfolios": 100,
            "buy": 0.31537,
            "delta": 0,
            "ext_field1": 0,
            "ext_field2": 0,
            "fin_res": 0,
            "fin_res_wo_c": 0,
            "first_delta": 0,
            "k": 0,
            "k1": 0,
            "k2": 0,
            "lim_b": 0,
            "lim_s": 0,
            "opened": 0,
            "opened_comission": 0,
            "percent": 100,
            "price_b": 0,
            "price_check": 10,
            "price_s": 0,
            "sell": 0.31532,
            "tp": 1,
            "uf0": {},
            "uf1": {"c":"asd", "v":1},
            "uf2": {"c":"qwe"},
            "uf3": {"v":666},
            "_buy_en": false,
            "_fin_res_en": false,
            "_fin_res_stop": false,
            "_freq_en": false,
            "_l_b_en": false,
            "_l_b_stop": false,
            "_l_s_en": false,
            "_l_s_stop": false,
            "_max_running_en": false,
            "_pos_en": false,
            "_sell_en": false,
            "_too_much_n_h_en": false,
            "always_limits_timer": false,
            "custom_trade": false,
            "disabled": false,
            "equal_prices": false,
            "ext_formulas": false,
            "has_virtual": true,
            "is_fin_res_wo_c": false,
            "quote": false,
            "re_buy": false,
            "re_sell": false,
            "simply_first": false,
            "to0": false,
            "use_tt": false,
            "virtual_0_pos": false,
            "timetable": [
                {
                    "begin": 36000,
                    "end": 50400,
                    "auto_sell": false,
                    "auto_buy": false,
                    "auto_close": false,
                    "auto_to_market": true,
                    "auto_to0": false
                },
                {
                    "begin": 50580,
                    "end": 67020,
                    "auto_sell": false,
                    "auto_buy": false,
                    "auto_close": false,
                    "auto_to_market": true,
                    "auto_to0": false
                }
            ]
        }
    },
    "r": "s",
    "eid": "qwerty",
    "ts": 1669808254519347837
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > value | y | object |  | Portfolio update |
| >> name | y | string |  | Portfolio name |
| >> __action = del | n | string |  | Only on delete |
| >> * | n | * |  | Other portfolio fields from template |
| >> securities | n | object |  | Securities |
| >>> SEC_KEY | n | string: object |  | Security object key |
| >>>> sec_key | y | string |  | Security unique key (should be equal to SEC_KEY) |
| >>>> __action = del | n | string |  | Only on delete |
| >>>> * | n | * |  | Other security fields from template |

Example:

```json
{
    "type": "portfolio.subscribe",
    "data": {
        "r_id": "1",
        "p_id": "test3",
        "value": {
            "name": "test3",
            "owner": "test@gmail.com",
            "sell": 0.31526,
            "buy": 0.31527
            "uf2": {"c":"qwert"},
            "uf1": {"v":5},
            "uf0": {"v":6, "c":"zxc"},
        }
    },
    "r": "u",
    "eid": "qwerty",
    "ts": 1669808258692270689
}
```

```json
{
    "type": "portfolio.subscribe",
    "data": {
        "r_id": "1",
        "p_id": "test3",
        "value": {
            "name": "test3",
            "owner": "test@gmail.com",
            "__action": "del"
        }
    },
    "r": "u",
    "eid": "qwerty",
    "ts": 1669810178671322447
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от портфеля

Отписаться от событий по портфелю

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"portfolio.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"portfolio.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### “Сбросить” статусы заявок портфеля

“Сбросить” статусы всех заявок всех инструментов выбранного портфеля

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.reset_statuses | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio.reset_statuses",
	"data": {
		"r_id": "1",
		"p_id": "test"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.reset_statuses | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type":"portfolio.reset_statuses",
	"data":
	{
		"r_id":"1",
		"p_id":"test3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.reset_statuses | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.reset_statuses",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Остановить торговлю и снять заявки портфеля

Остановить торговлю и снять все заявки выбранного портфеля

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.hard_stop | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio.hasrd_stop",
	"data": {
		"r_id": "1",
		"p_id": "test"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.hard_stop | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type":"portfolio.hard_stop",
	"data":
	{
		"r_id":"1",
		"p_id":"test3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.hard_stop | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.hard_stop",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Выключить все формулы портфеля

Остановить торговлю и отключить все формулы выбранного портфеля

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.formulas_stop | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio.formulas_stop",
	"data": {
		"r_id": "1",
		"p_id": "test"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.formulas_stop | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type":"portfolio.formulas_stop",
	"data":
	{
		"r_id":"1",
		"p_id":"test3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.formulas_stop | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.formulas_stop",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### “Скинуть” портфель “в рынок”

Скинуть портфель в рынок

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.to_market | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio.to_market",
	"data": {
		"r_id": "1",
		"p_id": "test"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.to_market | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type":"portfolio.to_market",
	"data":
	{
		"r_id":"1",
		"p_id":"test3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.to_market | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.to_market",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Купить портфель

Купить выбранный портфель в заданном количестве

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.buy_portfolio | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > quantity | y | number |  | Integer number of portfolios to buy |

Example:

```json
{
	"type": "portfolio.buy_portfolio",
	"data": {
		"r_id": "1",
		"p_id": "test",
		"quantity": 10
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.buy_portfolio | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type":"portfolio.buy_portfolio",
	"data":
	{
		"r_id":"1",
		"p_id":"test3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.buy_portfolio | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.buy_portfolio",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Продать портфель

Продать выбранный портфель в заданном количестве

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.sell_portfolio | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > quantity | y | number |  | Integer number of portfolios to sell |

Example:

```json
{
	"type": "portfolio.sell_portfolio",
	"data": {
		"r_id": "1",
		"p_id": "test",
		"quantity": 10
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.sell_portfolio | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type":"portfolio.sell_portfolio",
	"data":
	{
		"r_id":"1",
		"p_id":"test3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.sell_portfolio | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.sell_portfolio",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Выставить заявку по бумаге портфеля

Выставить заявку на покупку/продажу выбранной бумаги выбранного портфеля в заданном количестве по заданной цене

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.order_security | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > quantity | y | number |  | Number of contracts to buy/sell |
| > price | y | number |  | Order price |
| > key | y | string |  | Security’s SecKey |
| > dir | y | number | direction | Order direction |

Example:

```json
{
	"type": "portfolio.order_security",
	"data": {
		"r_id": "1",
		"p_id": "test",
		"quantity": 1,
		"price": 0.1,
		"key": "OKF_ADA_USDT_SWAP",
		"dir": 1
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.order_security | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type":"portfolio.order_security",
	"data":
	{
		"r_id":"1",
		"p_id":"test3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.order_security | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.order_security",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Протестировать формулу портфеля

Протестировать формулу портфеля.

Ответ может быть получен через достаточно большой интервал времени, т.к. пользовательский код необходимо скомпилировать и выполнить

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.test_formula | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > value | y | string |  | Formula field value (C++ code) |
| > field | y | string |  | Formula field name |
| > sec_key | n | string |  | Security’s SecKey, can be omitted if formula doesn’t belong to security |

Example:

```json
{
	"type": "portfolio.order_security",
	"data": {
		"r_id": "1",
		"p_id": "test",
		"sec_key": "",
		"field": "ext_field1_",
		"value": "return 2+3;"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.test_formula | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > val | y | number |  | Test formula result |
| > warn | n | string |  | Warning message |

Example:

```json
{
	"type":"portfolio.test_formula",
	"data":
	{
		"r_id":"1",
		"p_id":"test3",
		"val":0,
		"warn":"libs/__compile.cpp: In function ‘double __ext_field1_()’:\libs/__compile.cpp:16:5: warning: unused variable ‘a’ [-Wunused-variable]\\n   16 | int a = 0;return 0;\n      |     ^\n"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.test_formula | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.test_formula",
	"data":
	{
		"msg":"Compilation on \"__eval__\" failed with error:\nlibs/__compile.cpp: In function ‘double __ext_field1_()’:\nlibs/__compile.cpp:16:9: error: expected ‘;’ before ‘return’\n   16 | return 0\n      |         ^\n      |         ;\n   17 | return 0;\n      | ~~~~~~   \n",
		"code":777
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Написать на почту “создателю” портфеля [роль: admin]

Написать сообщение на почту старшего трейдера и на почты "создателю" данного портфеля

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.mail_to | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > to_head | y | boolean |  | Also mail to `head_of_traders` role |
| > subj | y | string |  | Message subject, `${ROBOT_ID}` will be replaced with current robot's ID, `${PORTFOLIO_ID}` will be replaced with current portfolio name + robot's ID |
| > msg | y | string |  | Message text, `${ROBOT_ID}` will be replaced with current robot's ID, `${PORTFOLIO_ID}` will be replaced with current portfolio name + robot's ID |
| > html | n | boolean |  | Send message as HTML, default value is false |

Example:

```json
{
	"type": "portfolio.mail_to",
	"data": {
                "to_head": true,
		"r_id": "1",
		"p_id": "test",
		"subj":"Test ${PORTFOLIO_ID}",
                "msg":"Test ${PORTFOLIO_ID}"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.mail_to | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > emails | y | array |  |  |
| >> [] | y | array |  | List of emails message was sent to |

Example:

```json
{
	"type":"portfolio.mail_to",
	"data":
	{
		"emails": ["test@gmail.com"]
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio.mail_to | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio.mail_to",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

## История изменений полей портфеля

### Подписка на отдельные поля портфеля

Подписаться на изменения конкретного поля портфеля

При удалении портфеля вы НЕ будете автоматически отписаны от его полей

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > key | y | string |  | Portfolio field key, one of: 'sell', 'buy', 'lim_s', 'lim_b', 'pos', 'fin_res', 'uf0', ..., 'uf19'|
| > aggr | y | string |  | Aggregation period, one of: 'raw', '10s', '1m', '10m', '1h', '6h', '24h' |
| > mt | n | epoch_msec |  | Minumum date/time to include in snapshot, set null to get last values (maximum number of returned values is 10000) |

Example:

```json
{
	"type":"portfolio_history.subscribe",
	"data":
	{
		"r_id":"1",
		"p_id":"b1",
		"key":"sell",
		"aggr":"raw"
	},
	"eid":"12"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > mt | y | number | epoch_msec | Max time, written in data base (can be null) |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > key | y | string |  | Portfolio field key, one of: 'sell', 'buy', 'lim_s', 'lim_b', 'pos', 'fin_res', 'uf0', ..., 'uf19'|
| > aggr | y | string |  | Aggregation period, one of: 'raw', '10s', '1m', '10m', '1h', '6h', '24h' |
| > values | y | object |  | Field values snapshot |
| >> [] | y | array |  | List of field values |
| >>> dt | y | number | epoch_msec | Field value time |
| >>> v | y | number |  | Field value |

Example:

```json
{
	"type":"portfolio_history.subscribe",
	"data":
	{
		"r_id":"1",
		"p_id":"b1",
		"key":"sell",
		"aggr":"raw",
		"values":
		[
			{"dt":1717592977733,"v":67249.73}
		],
		"mt":1717592977733
	},
	"r":"s",
	"eid":"2745",
	"ts":1717592980360842097
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > key | y | string |  | Portfolio field key, one of: 'sell', 'buy', 'lim_s', 'lim_b', 'pos', 'fin_res', 'uf0', ..., 'uf19'|
| > aggr | y | string |  | Aggregation period, one of: 'raw', '10s', '1m', '10m', '1h', '6h', '24h' |
| > values | y | object |  | Field values snapshot |
| >> [] | y | array |  | List of field values |
| >>> dt | y | number | epoch_msec | Field value time |
| >>> v | y | number |  | Field value |

Example:

```json
{
	"type":"portfolio_history.subscribe",
	"data":
	{
		"r_id":"1",
		"p_id":"b1",
		"key":"sell",
		"aggr":"raw",
		"values":
		[
			{"dt":1717592977743,"v":67249.74}
		]
	},
	"r":"u",
	"eid":"2745",
	"ts":1717592980360845097
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_history.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от поля портфеля

Отписаться от обновление по полю портфеля

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"portfolio_history.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"portfolio_history.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_history.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>

### Запрос истории изменений поля портфеля

Получить “небольшую” историю старше заданной даты

Т.к. запрашивается история аггрегатов, то `lim` относится именно к числу аггрегатов, реальное получаемое количество точек при этом может быть больше (аж в 3 раза). Чтобы узнать к какому именно аггрегату относится точка необходимо время точки разделить на длину аггрегата, взять целую часть и полученное значение умножить на длину аггрегата

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > key | y | string |  | Portfolio field key, one of: 'sell', 'buy', 'lim_s', 'lim_b', 'pos', 'fin_res', 'uf0', ..., 'uf19'|
| > aggr | y | string |  | Aggregation period, one of: 'raw', '10s', '1m', '10m', '1h', '6h', '24h' |
| > mt | y | number | epoch_msec | Receive rows “older” than this value. This value is recommended to be multiple of aggregation period in milliseconds |
| > lim | n | number |  | Number of rows to receive in range [1, 1000], default value is 1000 |

Example:

```json
{
	"type": "portfolio_history.get_previous",
	"data": {
		"r_id": "1",
		"p_id": "test2",
		"key":"sell",
		"aggr":"raw",
		"mt": "2000000000000000000",
		"lim": 100
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > key | y | string |  | Portfolio field key, one of: 'sell', 'buy', 'lim_s', 'lim_b', 'pos', 'fin_res', 'uf0', ..., 'uf19'|
| > aggr | y | string |  | Aggregation period, one of: 'raw', '10s', '1m', '10m', '1h', '6h', '24h' |
| > values | y | object |  | Field values snapshot |
| >> [] | y | array |  | List of field values |
| >>> dt | y | number | epoch_msec | Field value time |
| >>> v | y | number |  | Field value |

Example:

```json
{
    "type": "portfolio_history.get_previous",
    "data": {
	"r_id":"1",
	"p_id":"b1",
	"key":"sell",
	"aggr":"raw",
        "values":
		[
			{"dt":1717592977733,"v":67249.73},
			{"dt":1717592977933,"v":67249.75}
		],
    },
    "r": "p",
    "eid": "q0",
    "ts": 1676366845413318695
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_history.get_previous",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Запрос истории изменений поля портфеля 2

Получить историю от даты до даты

Т.к. запрашивается история аггрегатов, то `lim` относится именно к числу аггрегатов, реальное получаемое количество точек при этом может быть больше (аж в 3 раза). Чтобы узнать к какому именно аггрегату относится точка необходимо время точки разделить на длину аггрегата, взять целую часть и полученное значение умножить на длину аггрегата

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > key | y | string |  | Portfolio field key, one of: 'sell', 'buy', 'lim_s', 'lim_b', 'pos', 'fin_res', 'uf0', ..., 'uf19'|
| > aggr | y | string |  | Aggregation period, one of: 'raw', '10s', '1m', '10m', '1h', '6h', '24h' |
| > mint | y | number | epoch_msec | Receive rows “newer” or equal than this value. This value is recommended to be multiple of aggregation period in milliseconds |
| > maxt | y | number | epoch_msec | Receive rows “older” or equal than this value. This value is recommended to be multiple of aggregation period in milliseconds |
| > lim | n | number |  | Number of rows to receive in range [1, 100000], default value is 100000 |

Example:

```json
{
	"type": "portfolio_history.get_history",
	"data": {
		"r_id":"1",
		"p_id":"b1",
		"key":"sell",
		"aggr":"raw",
		"maxt": "2000000000000",
		"mint": "1",
		"lim": 100
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > key | y | string |  | Portfolio field key, one of: 'sell', 'buy', 'lim_s', 'lim_b', 'pos', 'fin_res', 'uf0', ..., 'uf19'|
| > aggr | y | string |  | Aggregation period, one of: 'raw', '10s', '1m', '10m', '1h', '6h', '24h' |
| > values | y | object |  | Field values snapshot |
| >> [] | y | array |  | List of field values |
| >>> dt | y | number | epoch_msec | Field value time |
| >>> v | y | number |  | Field value |

Example:

```json
{
    "type": "portfolio_history.get_history",
    "data": {
	"r_id":"1",
	"p_id":"b1",
	"key":"sell",
	"aggr":"raw",
        "values":
		[
			{"dt":1717592977733,"v":67249.73},
			{"dt":1717592977933,"v":67249.75}
		],
    },
    "r": "p",
    "eid": "q0",
    "ts": 1676366845413318695
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_history.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_history.get_history",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

## Роботы

### Подписка на робота

Подписаться на события изменения полей робота

В любой момент может быть выслан снапшот

При удалении робота вы будете от него отписаны

md_st, tr_st, re, trans_cnt всегда ходят целиком

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "robot.subscribe",
	"data": {
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > value | y | object |  |  |
| >> rc | y | boolean |  | Is robot connected to backend |
| >> rv | y | string |  | Robot version |
| >> rvd | y | number | epoch_sec | Robot version date (-1 means unknown) |
| >> ll | y | string |  | Label |
| >> de | y | number |  | Elapsed days, 0 means expired, -1 means unknown |
| >> dt | y | number | epoch_msec | Robot date/time (0 means unknown) |
| >> mtc | y | number |  | Robot transaction connections limit |
| >> mc | y | number |  | Robot main loop counter |
| >> mdc | y | number | stream_status | Market-data connections status |
| >> trc | y | number | stream_status | Trade connection status |
| >> tr | y | number | trading_status | Is robot trading |
| >> bld | y | string |  | Build name |
| >> ps | y | number | process_status | Robot process status |
| >> sv | y | string |  | Server build robot version |
| >> svd | y | number | epoch_sec | Server build robot version date (-1 means unknown) |
| >> start | y | boolean |  | Robot should be started |
| >> resp_users | y | array |  | List of responsible users emails as list of strings |
| >> md_st | y | array |  |  |
| >>> [] | y |  |  | Array of dictionaries of data-stream states with stream name as a key and value of type stream_status |
| >> tr_st | y | array |  |  |
| >>> [] | y |  |  | Array of dictionaries of data-stream states with stream name as a key and value of type stream_status |
| >> re | y | array |  |  |
| >>> [] | y |  |  |  |
| >>>> n | y | string |  | Portfolio name |
| >>>> f | y | boolean |  | Is free or has active orders |
| >>>> re | y | boolean |  | Is re_sell or re_buy |
| >> c_id | y | string |  | Company unique ID |
| >> comp | y | string |  | Company name |
| >> p_cnt | n | number |  | "Production" transactions count |
| >> v_cnt | n | number |  | "Virtual" transactions count |
| >> trans_cnt | n | array |  |  |
| >>> [] | n |  |  | Array of objects |
| >>>> n | y | string |  | Name |
| >>>> s | y | number |  | Transaction count |
| >>>> a | y | number |  | Adds count |
| >>>> d | y | number |  | Deletes count |
| >>>> m | y | number |  | Moves count |
| >>>> ra | y | number |  | Add rejects count |


Example:

```json
{
    "type": "robot.subscribe",
    "data": {
        "r_id": "1",
        "value": {
            "rc": true,
            "rv": "ec1d046c",
            "rvd": 1687175149,
            "ll": "Test robot",
            "de": 3614,
            "dt": 1687779242000,
            "mtc": 10,
            "mc": 10850,
            "mdc": 2,
            "trc": 2,
            "tr": 2,
            "r_id": "1",
            "bld": "vikingrobot.vrb_test",
            "ps": 2,
            "sv": "ec1d046",
            "svd": 1687175149,
            "start": true,
            "resp_users": ["test@gmail.com"],
            "md_st": [
                {
                    "sec_type": 1048576,
                    "name": "bitmex_listen",
                    "st": {
                        "Definitions": 1,
                        "OB": 0,
                        "Prices": 0,
                        "Socket": 2,
                        "States": 0
                    }
                },
                {
                    "sec_type": 67108864,
                    "name": "okex_listen_aws",
                    "st": {
                        "Definitions": 1,
                        "Extra": 1,
                        "Funding": 1,
                        "OB": 1,
                        "Socket": 2
                    }
                }
            ],
            "tr_st": [
                {
                    "sec_type": 1048576,
                    "name": "qwe",
                    "st": {
                        "Margin": 0,
                        "Orders": 0,
                        "Positions": 0,
                        "Socket": 0,
                        "Trades": 0
                    }
                },
                {
                    "sec_type": 1048576,
                    "name": "roma",
                    "st": {
                        "Margin": 0,
                        "Orders": 0,
                        "Positions": 0,
                        "Socket": 1,
                        "Trades": 0
                    }
                },
                {
                    "sec_type": 0,
                    "name": "virtual",
                    "st": {
                        "TRANS": 2
                    }
                }
            ],
            "tr": 0,
            "re": [
                {
                    "n": "replace",
                    "f": true,
                    "re": false
                },
                {
                    "n": "test1",
                    "f": true,
                    "re": false
                }
            ]
        }
    },
    "r": "s",
    "eid": "q0",
    "ts": 1687779242801030176
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > value | y | object |  |  |
| >> rc | n | boolean |  | Is robot connected to backend |
| >> rv | n | string |  | Robot version |
| >> rvd | n | number | epoch_sec | Robot version date (-1 means unknown) |
| >> ll | n | string |  | Label |
| >> de | n | number |  | Elapsed days, 0 means expired, -1 means unknown |
| >> dt | n | number | epoch_msec | Robot date/time (0 means unknown) |
| >> mtc | n | number |  | Robot transaction connections limit |
| >> mc | n | number |  | Robot main loop counter |
| >> mdc | n | number | stream_status | Market-data connections status |
| >> trc | n | number | stream_status | Trade connection status |
| >> tr | n | number | trading_status | Is robot trading |
| >> bld | n | string |  | Build name |
| >> ps | n | number | process_status | Robot process status |
| >> sv | n | string |  | Server build robot version |
| >> svd | n | number | epoch_sec | Server build robot version date (-1 means unknown) |
| >> start | n | boolean |  | Robot should be started |
| >> resp_users | y | array |  | List of responsible users emails as list of strings |
| >> md_st | n | array |  |  |
| >>> [] | n |  |  | Aray of dictionaries of data-stream states with stream name as a key and value of type stream_status |
| >> tr_st | n | array |  |  |
| >>> [] | n |  |  | Aray of dictionaries of data-stream states with stream name as a key and value of type stream_status |
| >> re | n | array |  |  |
| >>> [] | n |  |  |  |
| >>>> n | n | string |  | Portfolio name |
| >>>> f | n | boolean |  | Is free or has active orders |
| >>>> re | n | boolean |  | Is resell or re_buy |
| >> c_id | y | string |  | Company unique ID |
| >> comp | y | string |  | Company name |
| >> p_cnt | n | number |  | "Production" transactions count |
| >> v_cnt | n | number |  | "Virtual" transactions count |
| >> trans_cnt | n | array |  |  |
| >>> [] | n |  |  | Array of objects |
| >>>> n | y | string |  | Name |
| >>>> s | y | number |  | Transaction count |
| >>>> a | y | number |  | Adds count |
| >>>> d | y | number |  | Deletes count |
| >>>> m | y | number |  | Moves count |
| >>>> ra | y | number |  | Add rejects count |

Example:

```json
{"type":"robot.subscribe","data":{"r_id":"1","value":{"mc":11408,"dt":1677747006000}},"r":"u","eid":"q0","ts":1677747006005445923}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от робота

Отписаться от событий по роботу

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"robot.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"robot.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Подписка на робота (для админа)

Подписаться на события изменения полей робота

В любой момент может быть выслан снапшот

При удалении робота вы будете от него отписаны

md_st, tr_st, re, trans_cnt всегда ходят целиком

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "adm_robot.subscribe",
	"data": {
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > value | y | object |  |  |
| >> rc | y | boolean |  | Is robot connected to backend |
| >> rv | y | string |  | Robot version |
| >> rvd | y | number | epoch_sec | Robot version date (-1 means unknown) |
| >> ll | y | string |  | Label |
| >> de | y | number |  | Elapsed days, 0 means expired, -1 means unknown |
| >> exp | y | number | epoch_sec | Robot expiration |
| >> dt | y | number | epoch_msec | Robot date/time (0 means unknown) |
| >> mtc | y | number |  | Robot transaction connections limit |
| >> mc | y | number |  | Robot main loop counter |
| >> mdc | y | number | stream_status | Market-data connections status |
| >> trc | y | number | stream_status | Trade connection status |
| >> tr | y | number | trading_status | Is robot trading |
| >> bld | y | string |  | Build name |
| >> ps | y | number | process_status | Robot process status |
| >> sv | y | string |  | Server build robot version |
| >> svd | y | number | epoch_sec | Server build robot version date (-1 means unknown) |
| >> start | y | boolean |  | Robot should be started |
| >> srv | y | string |  | Server name |
| >> ld | y | number |  | Log days |
| >> cpu | y | number |  | CPU of main thread |
| >> ecpus | y | array |  | Array of integers of extra CPUs |
| >> c_id | y | string |  | Company unique ID |
| >> comp | y | string |  | Company name |
| >> cmnt | y | string |  | Comment |
| >> ips | y | array |  | List of ips as list of strings |
| >> resp_users | y | array |  | List of responsible users emails as list of strings |
| >> cmd | y | string |  | Command line params |
| >> phl | y | number |  | Portfolios history limit |
| >> fin_res_lim | y | number |  | Fin res history limit |
| >> deals_lim | y | number |  | Deals history limit |
| >> srv_runme | y | boolean |  | Use runme on server |
| >> md_st | y | array |  |  |
| >>> [] | y |  |  | Aray of dictionaries of data-stream states with stream name as a key and value of type stream_status |
| >> tr_st | y | array |  |  |
| >>> [] | y |  |  | Aray of dictionaries of data-stream states with stream name as a key and value of type stream_status |
| >> re | y | array |  |  |
| >>> [] | y |  |  |  |
| >>>> n | y | string |  | Portfolio name |
| >>>> f | y | boolean |  | Is free or has active orders |
| >>>> re | y | boolean |  | Is resell or re_buy |
| >> p_cnt | n | number |  | "Production" transactions count |
| >> v_cnt | n | number |  | "Virtual" transactions count |
| >> trans_cnt | n | array |  |  |
| >>> [] | n |  |  | Array of objects |
| >>>> n | y | string |  | Name |
| >>>> s | y | number |  | Transaction count |
| >>>> a | y | number |  | Adds count |
| >>>> d | y | number |  | Deletes count |
| >>>> m | y | number |  | Moves count |
| >>>> ra | y | number |  | Add rejects count |

Example:

```json
{
    "type": "adm_robot.subscribe",
    "data": {
        "r_id": "1",
        "value": {
            "rc": true,
            "rv": "ec1d046c",
            "rvd": 1687175149,
            "ll": "Test robot",
            "de": 3614,
            "dt": 1687779242000,
            "mtc": 10,
            "mc": 10850,
            "mdc": 2,
            "trc": 2,
            "tr": 2,
            "r_id": "1",
            "bld": "vikingrobot.vrb_test",
            "ps": 2,
            "sv": "ec1d046",
            "svd": 1687175149,
            "start": true,
            "resp_users": ["test@gmail.com"],
            "md_st": [
                {
                    "sec_type": 1048576,
                    "name": "bitmex_listen",
                    "st": {
                        "Definitions": 1,
                        "OB": 0,
                        "Prices": 0,
                        "Socket": 2,
                        "States": 0
                    }
                },
                {
                    "sec_type": 67108864,
                    "name": "okex_listen_aws",
                    "st": {
                        "Definitions": 1,
                        "Extra": 1,
                        "Funding": 1,
                        "OB": 1,
                        "Socket": 2
                    }
                }
            ],
            "tr_st": [
                {
                    "sec_type": 1048576,
                    "name": "qwe",
                    "st": {
                        "Margin": 0,
                        "Orders": 0,
                        "Positions": 0,
                        "Socket": 0,
                        "Trades": 0
                    }
                },
                {
                    "sec_type": 1048576,
                    "name": "roma",
                    "st": {
                        "Margin": 0,
                        "Orders": 0,
                        "Positions": 0,
                        "Socket": 1,
                        "Trades": 0
                    }
                },
                {
                    "sec_type": 0,
                    "name": "virtual",
                    "st": {
                        "TRANS": 2
                    }
                }
            ],
            "tr": 0,
            "re": [
                {
                    "n": "replace",
                    "f": true,
                    "re": false
                },
                {
                    "n": "test1",
                    "f": true,
                    "re": false
                }
            ]
        }
    },
    "r": "s",
    "eid": "q0",
    "ts": 1687779242801030176
}
```

```json
{
    "type": "adm_robot.subscribe",
    "data": {
        "r_id": "1",
        "value": {
            "rc": false,
            "rv": "",
            "rvd": 0,
            "md_st": [],
            "tr_st": [],
            "re": [],
            "de": -1,
            "dt": 0,
            "mtc": 10,
            "exp": 2000000000,
            "mc": -1,
            "mdc": 3,
            "trc": 3,
            "tr": 3,
            "r_id": "1",
            "srv": "local",
            "ll": "Robot name4",
            "ld": 5,
            "start": true,
            "bld": "vikingrobot.vrb_test",
            "resp_users": ["test@gmail.com"],
            "ps": 2,
            "sv": "0bbb5ae",
            "svd": 1689597843,
            "cpu": 2,
            "ecpus": [
                0
            ],
            "c_id": "0",
            "comp": "public",
            "cmnt": "Comment3",
            "ips": [
                "0.0.0.0"
            ],
            "cmd": "--cpu=1",
            "srv_runme": true
        }
    },
    "r": "s",
    "eid": "q0",
    "ts": 1690368750723349467
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > value | y | object |  |  |
| >> rc | n | boolean |  | Is robot connected to backend |
| >> rv | n | string |  | Robot version |
| >> rvd | n | number | epoch_sec | Robot version date (-1 means unknown) |
| >> ll | n | string |  | Label |
| >> de | n | number |  | Elapsed days, 0 means expired, -1 means unknown |
| >> exp | y | number | epoch_sec | Robot expiration |
| >> dt | n | number | epoch_msec | Robot date/time (0 means unknown) |
| >> mtc | n | number |  | Robot transaction connections limit |
| >> mc | n | number |  | Robot main loop counter |
| >> mdc | n | number | stream_status | Market-data connections status |
| >> trc | n | number | stream_status | Trade connection status |
| >> tr | n | number | trading_status | Is robot trading |
| >> bld | n | string |  | Build name |
| >> ps | n | number | process_status | Robot process status |
| >> sv | n | string |  | Server build robot version |
| >> svd | n | number | epoch_sec | Server build robot version date (-1 means unknown) |
| >> start | n | boolean |  | Robot should be started |
| >> srv | n | string |  | Server name |
| >> ld | n | number |  | Log days |
| >> cpu | n | number |  | CPU of main thread |
| >> ecpus | n | array |  | Array of integers of extra CPUs |
| >> c_id | n | string |  | Company unique ID |
| >> comp | n | string |  | Company name |
| >> cmnt | n | string |  | Comment |
| >> ips | n | array |  | List of ips as list of strings |
| >> resp_users | n | array |  | List of responsible users emails as list of strings |
| >> cmd | n | string |  | Command line params |
| >> phl | n | number |  | Portfolios history limit |
| >> fin_res_lim | n | number |  | Fin res history limit |
| >> deals_lim | n | number |  | Deals history limit |
| >> srv_runme | n | boolean |  | Use runme on server |
| >> md_st | n | array |  |  |
| >>> [] | n |  |  | Aray of dictionaries of data-stream states with stream name as a key and value of type stream_status |
| >> tr_st | n | array |  |  |
| >>> [] | n |  |  | Aray of dictionaries of data-stream states with stream name as a key and value of type stream_status |
| >> re | n | array |  |  |
| >>> [] | n |  |  |  |
| >>>> n | n | string |  | Portfolio name |
| >>>> f | n | boolean |  | Is free or has active orders |
| >>>> re | n | boolean |  | Is resell or re_buy |
| >> p_cnt | n | number |  | "Production" transactions count |
| >> v_cnt | n | number |  | "Virtual" transactions count |
| >> trans_cnt | n | array |  |  |
| >>> [] | n |  |  | Array of objects |
| >>>> n | y | string |  | Name |
| >>>> s | y | number |  | Transaction count |
| >>>> a | y | number |  | Adds count |
| >>>> d | y | number |  | Deletes count |
| >>>> m | y | number |  | Moves count |
| >>>> ra | y | number |  | Add rejects count |

Example:

```json
{
    "type": "adm_robot.subscribe",
    "data": {
        "r_id": "1",
        "value": {
            "mc": 11408,
            "dt": 1677747006000
        }
    },
    "r": "u",
    "eid": "q0",
    "ts": 1677747006005445923
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от робота (для админа)

Отписаться от событий по роботу

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"adm_robot.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"adm_robot.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Подписка на список доступных роботов

При добавлении/удалении робота/доступа к роботу будут высланы обновления

В любой момент может быть выслан снапшот

При отзыве доступа к роботу, если вы подписаны на этот робот, вы получите сообщение об отписке

<details>
<summary>Subscription request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_robot_list.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | n | object |  |  |

Example:

```json
{
	"type": "available_robot_list.subscribe",
	"data": {},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_robot_list.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > robots_add | y | array |  | Array of available robots |
| >> [] | y | string |  | Robot ID |
|  |  |  |  |  |

Example:

```json
{
	"type":"available_robot_list.subscribe",
	"data":
	{
		"robots_add":
		[
			"1"
		]
	},
	"r":"s",
	"eid":"qwerty",
	"ts":1669793958010491759
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_robot_list.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > robots_add | n | array |  | Array of newly available robots |
| >> [] |  | string |  | Robot ID |
| > robots_del | n | array |  | Array of robots with revoked access |
| >> [] |  | string |  | Robot ID |

Example:

```json
{
	"type":"available_robot_list.subscribe",
	"data":
	{
		"robots_del":
		[
			"1"
		]
	},
	"r":"u",
	"eid":"qwerty",
	"ts":1669793958010491759
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_robot_list.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"available_robot_list.subscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от списка доступных роботов

Отписаться от событий по списку доступных роботов

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_robot_list.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"available_robot_list.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_robot_list.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"available_robot_list.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = available_robot_list.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"available_robot_list.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Перезапустить робота

Перезапустить не торгующего робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.restart_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "robot.restart_robot",
	"data": {"r_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.restart_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |

Example:

```json
{
	"type":"robot.restart_robot",
	"data":{},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.restart_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.restart_robot",
	"data":
	{
		"msg":"Internal error: Robot 1 was not stopped",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Изменить робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > ll | y | string |  | Label |

Example:

```json
{
	"type":"robot.update",
	"data":
	{
		"r_id":"10",
		"ll":"Robot name"
	},
	"eid":"qwe"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{"type":"*robot.update*","data":{},"r":"p","eid":"q0","ts":1689672324736098034}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.update",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Подписка на активные заявки робота

Подписаться на активные заявки робота

В любой момент может быть выслан снапшот

В обновлениях всегда приходят все данные по заявке, ключ — r_id + id

Когда заявка перестанет быть активной придет поле __action=del

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = orders.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "orders.subscribe",
	"data": 
	{
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = orders.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot id |
| > values | y | object |  | Servers |
| >> id | y | string |  | Order ID (unique for robot) |
| >> owner | y | string |  | Portfolio’s owner |
| >> sk | y | string |  | Security key |
| >> ono | y | string |  | Internal robot’s order id |
| >> p | y | number |  | Order price |
| >> q | y | number |  | Order quantity (always integer) |
| >> q0 | y | number |  | Order left quantity (always integer) |
| >> d | y | number | direction | Order direction |
| >> dec | y | number |  | Digits after decimal point in price |
| >> st | y | number | order_status | Internal robot’s order status |
| >> name | y | string |  | Portfolio name |
| >> r_id | y | string |  | Robot id |

Example:

```json
{
  "type": "orders.subscribe",
  "data": {
    "r_id": "1",
    "values": {
      "r_id": "1",
      "values": [
        {
          "id": "364182912",
          "owner": "infectedbyjs@gmail.com",
          "sk": "OKF_1INCH_USDT_SWAP",
          "ono": "7",
          "p": 0.1537,
          "q": 1,
          "q0": 1,
          "d": 1,
          "dec": 4,
          "st": 2,
          "name": "asdasd",
          "r_id": "1"
        }
      ]
    }
  },
  "r": "s",
  "eid": "q0",
  "ts": 1692877356436393434
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = orders.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot id |
| > values | y | object |  | Servers |
| >> id | y | string |  | Order ID (unique for robot) |
| >> owner | y | string |  | Portfolio’s owner |
| >> sk | y | string |  | Security key |
| >> ono | y | string |  | Internal robot’s order id |
| >> p | y | number |  | Order price |
| >> q | y | number |  | Order quantity (always integer) |
| >> q0 | y | number |  | Order left quantity (always integer) |
| >> d | y | number | direction | Order direction |
| >> dec | y | number |  | Digits after decimal point in price |
| >> st | y | number | order_status | Internal robot’s order status |
| >> name | y | string |  | Portfolio name |
| >> r_id | y | string |  | Robot id |
| >> __action=del | n |  |  |  |

Example:

```json
{
    "type": "orders.subscribe",
    "data": {
        "r_id": "1",
        "values": {
            "r_id": "1",
            "values": [
                {
                    "id": "364182912",
                    "owner": "infectedbyjs@gmail.com",
                    "sk": "OKF_1INCH_USDT_SWAP",
                    "ono": "7",
                    "p": 0.1537,
                    "q": 1,
                    "q0": 1,
                    "d": 1,
                    "dec": 4,
                    "st": 2,
                    "name": "asdasd",
                    "r_id": "1"
                }
            ]
        }
    },
    "r": "u",
    "eid": "q0",
    "ts": 1692877356436393434
}
```
    
```json
{
    "type": "orders.subscribe",
    "data": {
        "r_id": "1",
        "values": {
            "r_id": "1",
            "values": [
                {
                    "r_id": "1",
                    "id": "364182912",
                    "__action": "del"
                }
            ]
        }
    },
    "r": "u",
    "eid": "q0",
    "ts": 1692877419902208593
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_servers.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от активных заявок робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = orders.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"orders.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = orders.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"orders.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = orders.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"orders.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

## Финрез

### Подписка на таблицу финансовых результатов портфеля

Подписаться на новые записи в таблицу финансовых результатов портфеля

При удалении портфеля вы будете от него отписаны

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio_fin_res.subscribe",
	"data": {
		"r_id": "1",
		"p_id": "test3"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| mt | y | string | epoch_nsec | Max time, written in data base |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> name | y | string |  | Portfolio name |
| >>> r_id | y | string |  | Robot ID |
| >>> id | y | string |  | Unique row id for specified robot |
| >>> is_sl | y | boolean |  | Is stop loss row |
| >>> price | y | number |  | Price |
| >>> buy_sell | y | number | direction | Direction |
| >>> quantity | y | number |  | Integer quantity in number of portfolios |
| >>> virt | y | number |  | Is virtual row (1 — virtual, 0 — not virtual) |
| >>> trs | y | array |  | Trades |
| >>>> sk | y | string |  | SecKey |
| >>>> p | y | number |  | Price |
| >>>> q | y | number |  | Quantity |
| >>>> d | y | number | direction | Direction |
| >>>> ono | y | string |  | Order numebr |
| >>>> t | y | string |  | Time in format HH:MM:SS |
| >>> decimals | y | number |  | Integer number of decimal points in price field |
| >>> dt | y | string | epoch_nsec | Time in robot |

Example:

```json
{
    "type": "portfolio_fin_res.subscribe",
    "data": {
        "r_id": "1",
        "p_id": "test3",
        "values": [
            {
                "is_sl": false,
                "name": "test3",
                "price": 0,
                "buy_sell": 1,
                "quantity": 2,
                "virt": 0,
                "tt": "",
                "decimals": 4,
                "id": -5179112833974768457,
                "t": 1670930582000080585,
                "dt": 1670930582001236807,
                "r_id": "1"
            }
        ],
        "mt": 1670930581002172652
    },
    "r": "s",
    "eid": "q0",
    "ts": 1670930582765293894
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> id | y | string |  | Unique row id for specified robot |
| >>> is_sl | y | boolean |  | Is stop loss row |
| >>> price | y | number |  | Price |
| >>> buy_sell | y | number | direction | Direction |
| >>> quantity | y | number |  | Integer quantity in number of portfolios |
| >>> virt | y | number |  | Is virtual row (1 — virtual, 0 — not virtual) |
| >>> trs | y | array |  | Trades |
| >>>> sk | y | string |  | SecKey |
| >>>> p | y | number |  | Price |
| >>>> q | y | number |  | Quantity |
| >>>> d | y | number | direction | Direction |
| >>>> ono | y | string |  | Order numebr |
| >>>> t | y | string |  | Time in format HH:MM:SS |
| >>> decimals | y | number |  | Integer number of decimal points in price field |
| >>> dt | y | string | epoch_nsec | Time in robot |

Example:

```json
{
    "type": "portfolio_fin_res.subscribe",
    "data": {
        "r_id": "1",
        "p_id": "test3",
        "values": [
            {
                "is_sl": false,
                "price": 0,
                "buy_sell": 1,
                "quantity": 2,
                "virt": 0,
                "tt": "",
                "decimals": 4,
                "id": 6609278928069572738,
                "t": 1670930583000018528,
                "dt": 1670930583001302645
            }
        ]
    },
    "r": "u",
    "eid": "q0",
    "ts": 1670930583002402981
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_fin_res.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от таблицы финансовых результатов портфеля

Отписаться от таблицы финансовых результатов портфеля

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"portfolio_fin_res.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"portfolio_fin_res.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_fin_res.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Запрос истории финансовых результатов портфеля

Получить “небольшую” историю старше заданной даты

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | n | string |  | Portfolio name (use be empty string or null to remove filter) |
| > mt | y | string | epoch_nsec | Receive rows “older” than this value |
| > lim | n | number |  | Number of rows to receive in range [1, 100], default value is 100 |

Example:

```json
{
	"type": "portfolio_fin_res.get_previous",
	"data": {
		"r_id": "1",
		"p_id": "test2",
		"mt": "2000000000000000000",
		"lim": 100
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> name | y | string |  | Portfolio name |
| >>> r_id | y | string |  | Robot ID |
| >>> id | y | string |  | Unique row id for specified robot |
| >>> is_sl | y | boolean |  | Is stop loss row |
| >>> price | y | number |  | Price |
| >>> buy_sell | y | number | direction | Direction |
| >>> quantity | y | number |  | Integer quantity in number of portfolios |
| >>> virt | y | number |  | Is virtual row (1 — virtual, 0 — not virtual) |
| >>> trs | y | array |  | Trades |
| >>>> sk | y | string |  | SecKey |
| >>>> p | y | number |  | Price |
| >>>> q | y | number |  | Quantity |
| >>>> d | y | number | direction | Direction |
| >>>> ono | y | string |  | Order numebr |
| >>>> t | y | string |  | Time in format HH:MM:SS |
| >>> decimals | y | number |  | Integer number of decimal points in price field |
| >>> dt | y | string | epoch_nsec | Time in robot |

Example:

```json
{
    "type": "portfolio_fin_res.get_previous",
    "data": {
        "values": [
            {
                "id": "619092220240302220",
                "dt": "1676360033000143287",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            },
            {
                "id": "-6956967845141206966",
                "dt": "1676360032000122289",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            },
            {
                "id": "-4886891137386301017",
                "dt": "1676360031000160779",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            },
            {
                "id": "-3547157834499697168",
                "dt": "1676360030000187246",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            },
            {
                "id": "5167656097367947403",
                "dt": "1676360029000181881",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            }
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1676366276382789596
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_fin_res.get_previous",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Запрос истории финансовых результатов портфеля 2

Получить историю от даты до даты

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | n | string |  | Portfolio name (use be empty string or null to remove filter) |
| > mint | y | string | epoch_nsec | Receive rows “newer” or equal than this value |
| > maxt | y | string | epoch_nsec | Receive rows “older” or equal than this value |
| > lim | n | number |  | Number of rows to receive in range [1, 100000], default value is 100000 |

Example:

```json
{
	"type": "portfolio_fin_res.get_history",
	"data": {
		"r_id": "1",
		"p_id": "test2",
		"maxt": "2000000000000000000",
		"mint": "1",
		"lim": 100
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> name | y | string |  | Portfolio name |
| >>> r_id | y | string |  | Robot ID |
| >>> id | y | string |  | Unique row id for specified robot |
| >>> is_sl | y | boolean |  | Is stop loss row |
| >>> price | y | number |  | Price |
| >>> buy_sell | y | number | direction | Direction |
| >>> quantity | y | number |  | Integer quantity in number of portfolios |
| >>> virt | y | number |  | Is virtual row (1 — virtual, 0 — not virtual) |
| >>> trs | y | array |  | Trades |
| >>>> sk | y | string |  | SecKey |
| >>>> p | y | number |  | Price |
| >>>> q | y | number |  | Quantity |
| >>>> d | y | number | direction | Direction |
| >>>> ono | y | string |  | Order numebr |
| >>>> t | y | string |  | Time in format HH:MM:SS |
| >>> decimals | y | number |  | Integer number of decimal points in price field |
| >>> dt | y | string | epoch_nsec | Time in robot |

Example:

```json
{
    "type": "portfolio_fin_res.get_history",
    "data": {
        "values": [
            {
                "id": "619092220240302220",
                "dt": "1676360033000143287",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            },
            {
                "id": "-6956967845141206966",
                "dt": "1676360032000122289",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            },
            {
                "id": "-4886891137386301017",
                "dt": "1676360031000160779",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            },
            {
                "id": "-3547157834499697168",
                "dt": "1676360030000187246",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            },
            {
                "id": "5167656097367947403",
                "dt": "1676360029000181881",
                "r_id": "1",
                "name": "test2",
                "price": 0,
                "buy_sell": 1,
                "tt": "",
                "virt": 1,
                "quantity": 2,
                "is_sl": false,
                "decimals": 4
            }
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1676366276382789596
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_fin_res.get_history",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Подсчет средних финансовых результатов портфеля за период

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.calc_acg | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > mint | y | string | epoch_nsec | Use rows “newer” or equal than this value |
| > maxt | y | string | epoch_nsec | Use rows “older” or equal than this value |

Example:

```json
{
	"type": "portfolio_fin_res.calc_avg",
	"data": {
		"r_id": "1",
		"p_id": "test2",
		"mint": "0",
		"maxt": "2000000000000000000"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.calc_avg | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > avg | y | object |  | Portfolio snapshot |
| >> dec | y | number |  | Decimals |
| >> amount_buy | y | number |  | Buy amount |
| >> amount_sell | y | number |  | Sell amount |
| >> avg_buy | y | number |  | Average buy price |
| >> avg_sell | y | number |  | Average sell price |
| >> buy | y | array |  | Buy deals |
| >>> [] |  |  |  |  |
| >>>> d | y | number | direction | Direction |
| >>>> sk | y | string |  | SecKey |
| >>>> p | y | number |  | Price |
| >>>> dec | y | number |  | Decimals |
| >>>> q | y | number |  | Quantity |
| >> sell | y | array |  | Sell deals |
| >>> [] |  |  |  |  |
| >>>> d | y | number | direction | Direction |
| >>>> sk | y | string |  | SecKey |
| >>>> p | y | number |  | Price |
| >>>> dec | y | number |  | Decimals |
| >>>> q | y | number |  | Quantity |

Example:

```json
{
    "type": "portfolio_fin_res.calc_avg",
    "data": {
        "avg": {
            "dec": 4,
            "amount_buy": 2,
            "amount_sell": 4,
            "avg_sell": 0.535075,
            "avg_buy": 0.5352
        },
        "buy": [
            {
                "d": 1,
                "sk": "OKF_1INCH_USDT_SWAP",
                "p": 0.27625,
                "dec": 4,
                "q": 2
            },
            {
                "d": 1,
                "sk": "OKF_ADA_USDT_SWAP",
                "p": 0.25895,
                "dec": 4,
                "q": 2
            }
        ],
        "sell": [
            {
                "d": 1,
                "sk": "OKF_1INCH_USDT_SWAP",
                "p": 0.27615,
                "dec": 4,
                "q": 4
            },
            {
                "d": 1,
                "sk": "OKF_ADA_USDT_SWAP",
                "p": 0.258925,
                "dec": 4,
                "q": 4
            }
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1687247128675656052
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_fin_res.calc_avg | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_fin_res.calc_avg",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

## Сделки

### Подписка на сделки портфеля

Подписаться на новые записи в таблицу сделок портфеля

При удалении портфеля вы будете от него отписаны

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio_deals.subscribe",
	"data": {
		"r_id": "1",
		"p_id": "test3"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| mt | y | string | epoch_nsec | Max time, written in data base |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> name | y | string |  | Portfolio name |
| >>> r_id | y | string |  | Robot ID |
| >>> id | y | string |  | Unique row id for specified robot |
| >>> ono | y | string |  | Internal order number |
| >>> price | y | number |  | Deal price |
| >>> orig_price | y | number |  | Original order price |
| >>> buy_sell | y | number | direction | Deal direction |
| >>> quantity | y | number |  | Integer deal quantity |
| >>> cn | y | string |  | Transactional connection name |
| >>> sec | y | string |  | Security unique key |
| >>> decimals | y | number |  | Integer number of decimal points in price field |
| >>> dt | y | string | epoch_nsec | Time in robot |
| >>> curpos | y | number |  | Integer portfolio security position |

Example:

```json
{
    "type": "portfolio_deals.subscribe",
    "data": {
        "r_id": "1",
        "p_id": "test3",
        "values": [
            {
                "ono": 0,
                "sec": "BTC",
                "name": "test3",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "decimals": 4,
                "cn": "virtual",
                "id": -7788782202760318740,
                "t": 1670932198000080090,
                "dt": 1670932198001653551,
		"curpos": 1,
                "r_id": "1"
            },
            {
                "ono": 0,
                "sec": "BTC",
                "name": "test3",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "decimals": 4,
                "cn": "virtual",
                "id": -3752825875325269453,
                "t": 1670932199000047295,
                "dt": 1670932199001713057,
		"curpos": 1,
                "r_id": "1"
            },
            {
                "ono": 0,
                "sec": "BTC",
                "name": "test3",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "decimals": 4,
                "cn": "virtual",
                "id": -3688175048979008805,
                "t": 1670932200000058955,
                "dt": 1670932200001680729,
		"curpos": 1,
                "r_id": "1"
            },
            {
                "ono": 0,
                "sec": "BTC",
                "name": "test3",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "decimals": 4,
                "cn": "virtual",
                "id": 3502271702100740780,
                "t": 1670932201000080655,
                "dt": 1670932201001754776,
		"curpos": 1,
                "r_id": "1"
            }
        ],
        "mt": 1670932197144479740
    },
    "r": "s",
    "eid": "q0",
    "ts": 1670932201695689426
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> id | y | string |  | Unique row id for specified robot |
| >>> ono | y | string |  | Internal order number |
| >>> price | y | number |  | Deal price |
| >>> orig_price | y | number |  | Original order price |
| >>> buy_sell | y | number | direction | Deal direction |
| >>> quantity | y | number |  | Integer deal quantity |
| >>> cn | y | string |  | Transactional connection name |
| >>> sec | y | string |  | Security unique key |
| >>> decimals | y | number |  | Integer number of decimal points in price field |
| >>> dt | y | string | epoch_nsec | Time in robot |
| >>> curpos | y | number |  | Integer portfolio security position |

Example:

```json
{
    "type": "portfolio_deals.subscribe",
    "data": {
        "r_id": "1",
        "p_id": "test3",
        "values": [
            {
                "ono": 0,
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "decimals": 4,
                "cn": "virtual",
                "id": -3735218779281737327,
                "t": 1670932204000081702,
		"curpos": 1,
                "dt": 1670932204001796726
            }
        ]
    },
    "r": "u",
    "eid": "q0",
    "ts": 1670932204002772953
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_fin_res.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от сделок портфеля

Отписаться от таблицы сделок портфеля

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"portfolio_deals.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"portfolio_deals.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_deals.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Запрос истории сделок портфеля

Получить “небольшую” историю старше заданной даты

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > sec_key | n | string |  | SecKey name |
| > mt | y | string | epoch_nsec | Receive rows “older” than this value |
| > lim | n | number |  | Number of rows to receive in range [1, 100], default value is 100 |

Example:

```json
{
	"type": "portfolio_deals.get_previous",
	"data": {
		"r_id": "1",
		"p_id": "test2",
		"mt": "2000000000000000000",
		"lim": 100
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> name | y | string |  | Portfolio name |
| >>> r_id | y | string |  | Robot ID |
| >>> id | y | string |  | Unique row id for specified robot |
| >>> ono | y | string |  | Internal order number |
| >>> price | y | number |  | Deal price |
| >>> orig_price | y | number |  | Original order price |
| >>> buy_sell | y | number | direction | Deal direction |
| >>> quantity | y | number |  | Integer deal quantity |
| >>> cn | y | string |  | Transactional connection name |
| >>> sec | y | string |  | Security unique key |
| >>> decimals | y | number |  | Integer number of decimal points in price field |
| >>> dt | y | string | epoch_nsec | Time in robot |
| >>> curpos | y | number |  | Integer portfolio security position |

Example:

```json
{
    "type": "portfolio_deals.get_previous",
    "data": {
        "values": [
            {
                "id": "3721227031066024688",
                "dt": "1676360033000144435",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            },
            {
                "id": "2474504404744141531",
                "dt": "1676360032000123654",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            },
            {
                "id": "3876343940139371326",
                "dt": "1676360031000162174",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            },
            {
                "id": "-1618157002193750741",
                "dt": "1676360030000188693",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            },
            {
                "id": "2390688254517194909",
                "dt": "1676360029000183395",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            }
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1676366845413318695
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_fin_res.get_previous",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Запрос списка уникальных бумаг из истории сделок портфеля

Получить уникальные бумаги из истории сделок по портфелям

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.get_sec_keys | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |

Example:

```json
{
	"type": "portfolio_deals.get_sec_keys",
	"data": {
		"r_id": "1",
		"p_id": "test2"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.get_sec_keys | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of sec_keys |

Example:

```json
{
    "type": "portfolio_deals.get_sec_keys",
    "data": {
        "values": [
            "BTC"
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1676366845413318695
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.get_sec_keys | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_fin_res.get_sec_keys",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Запрос истории сделок портфеля 2

Получить историю от даты до даты

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > sec_key | n | string |  | SecKey name |
| > mint | y | string | epoch_nsec | Receive rows “newer” or equal than this value |
| > maxt | y | string | epoch_nsec | Receive rows “older” or equal than this value |
| > lim | n | number |  | Number of rows to receive in range [1, 100000], default value is 100000 |

Example:

```json
{
	"type": "portfolio_deals.get_history",
	"data": {
		"r_id": "1",
		"p_id": "test2",
		"maxt": "2000000000000000000",
		"mint": "1",
		"lim": 100
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> name | y | string |  | Portfolio name |
| >>> r_id | y | string |  | Robot ID |
| >>> id | y | string |  | Unique row id for specified robot |
| >>> ono | y | string |  | Internal order number |
| >>> price | y | number |  | Deal price |
| >>> orig_price | y | number |  | Original order price |
| >>> buy_sell | y | number | direction | Deal direction |
| >>> quantity | y | number |  | Integer deal quantity |
| >>> cn | y | string |  | Transactional connection name |
| >>> sec | y | string |  | Security unique key |
| >>> decimals | y | number |  | Integer number of decimal points in price field |
| >>> dt | y | string | epoch_nsec | Time in robot |
| >>> curpos | y | number |  | Integer portfolio security position |

Example:

```json
{
    "type": "portfolio_deals.get_history",
    "data": {
        "values": [
            {
                "id": "3721227031066024688",
                "dt": "1676360033000144435",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            },
            {
                "id": "2474504404744141531",
                "dt": "1676360032000123654",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            },
            {
                "id": "3876343940139371326",
                "dt": "1676360031000162174",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            },
            {
                "id": "-1618157002193750741",
                "dt": "1676360030000188693",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            },
            {
                "id": "2390688254517194909",
                "dt": "1676360029000183395",
                "r_id": "1",
                "name": "test2",
                "ono": "0",
                "sec": "BTC",
                "price": 1,
                "buy_sell": 1,
                "quantity": 1,
                "cn": "virtual",
		"curpos": 1,
                "decimals": 4
            }
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1676366845413318695
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_deals.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_fin_res.get_history",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

## Логи

### Подписка на логи портфеля

Подписаться на новые записи в таблицу логов портфеля

При удалении портфеля вы будете от него отписаны

Даже если логи идут с нужного портфеля, то вам они попадут только если email "автора" этой записи в лог пустой (т.е. лог общий) или email "автора" совпадает с email-ом с которого авторизован вебсокет или если роль, под которой авторизован вебсокет, помечена как роль, которой доступны все логи

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_logs.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "portfolio_logs.subscribe",
	"data": {
		"r_id": "1",
		"p_id": "test3"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_logs.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| mt | y | number | epoch_nsec | Max time, written in data base |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> name | y | string |  | Portfolio name |
| >>> id | y | string |  | Log message ID |
| >>> r_id | y | string |  | Robot ID |
| >>> level | y | number | log_level | Log level |
| >>> msg | y | string |  | Message |
| >>> owner | n | string |  | Message initiator, can be empty string or null |
| >>> t | y | number | epoch_nsec | Time in robot |
| >>> dt | y | number | epoch_nsec | Receive time of backend |

Example:

```json
{
    "type": "portfolio_logs.subscribe",
    "data": {
        "r_id": "1",
        "p_id": "test3",
        "values": [
            {
                "level": 0,
                "name": "test3",
                "msg": "Portfolio \"test3\" was added by test@gmail.com",
                "t": 1671194453000712498,
                "dt": 1671194453006554913,
                "r_id": "1"
            },
            {
                "level": 5,
                "name": "test3",
                "owner": "",
                "msg": "with owner",
                "t": 1671194454000077684,
                "dt": 1671194454001630241,
                "r_id": "1"
            },
            {
                "level": 5,
                "name": "test3",
                "owner": "",
                "msg": "with owner",
                "t": 1671194455000037908,
                "dt": 1671194455001268250,
                "r_id": "1"
            }
        ],
        "mt": 1671194446799559398
    },
    "r": "s",
    "eid": "q0",
    "ts": 1671194455524948386
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_logs.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | y | string |  | Portfolio name |
| > values | y | object |  | Portfolio snapshot |
| >> [] | y | array |  | List of financial results |
| >>> level | y | number | log_level | Log level |
| >>> id | y | string |  | Log message ID |
| >>> msg | y | string |  | Message |
| >>> owner | n | string |  | Message initiator, can be empty string or null |
| >>> t | y | number | epoch_nsec | Time in robot |
| >>> dt | y | number | epoch_nsec | Receive time of backend |

Example:

```json
{
    "type": "portfolio_logs.subscribe",
    "data": {
        "r_id": "1",
        "p_id": "test3",
        "values": [
            {
                "level": 5,
                "owner": "",
                "msg": "with owner",
                "t": 1671194458000035338,
                "dt": 1671194458000994686
            }
        ]
    },
    "r": "u",
    "eid": "q0",
    "ts": 1671194458001748066
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_logs.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_logs.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от логов портфеля

Отписаться от логов портфеля

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_logs.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"portfolio_logs.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_logs.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"portfolio_logs.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = portfolio_logs.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"portfolio_logs.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Подписка на логи робота

Подписаться на новые записи в таблицу логов робота

При удалении робота вы будете от него отписаны

Даже если логи идут с нужного робота, то вам они попадут только если email "автора" этой записи в лог пустой (т.е. лог общий) или email "автора" совпадает с email-ом с которого авторизован вебсокет или если роль, под которой авторизован вебсокет, помечена как роль, которой доступны все логи

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "robot_logs.subscribe",
	"data": {
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| mt | y | number | epoch_nsec | Max time, written in data base |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > values | y | object |  |  |
| >> [] | y | array |  | List of logs |
| >>> r_id | y | string |  | Robot ID |
| >>> id | y | string |  | Log message ID |
| >>> level | y | number | log_level | Log level |
| >>> msg | y | string |  | Message |
| >>> owner | n | string |  | Message initiator, can be empty string or null |
| >>> t | y | number | epoch_nsec | Time in robot |
| >>> dt | y | number | epoch_nsec | Receive time of backend |

Example:

```json
{
    "type": "robot_logs.subscribe",
    "data": {
        "r_id": "1",
        "values": [
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test3",
                "t": 1671195119000062295,
                "dt": 1671195119001430926,
                "r_id": "1"
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test1",
                "t": 1671195119000069175,
                "dt": 1671195119001430926,
                "r_id": "1"
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test",
                "t": 1671195119000074206,
                "dt": 1671195119001430926,
                "r_id": "1"
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test2",
                "t": 1671195119000076823,
                "dt": 1671195119001430926,
                "r_id": "1"
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test3",
                "t": 1671195120000032802,
                "dt": 1671195120001129882,
                "r_id": "1"
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test1",
                "t": 1671195120000038895,
                "dt": 1671195120001129882,
                "r_id": "1"
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test",
                "t": 1671195120000049849,
                "dt": 1671195120001129882,
                "r_id": "1"
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test2",
                "t": 1671195120000052864,
                "dt": 1671195120001129882,
                "r_id": "1"
            }
        ],
        "mt": 1671195116000769082
    },
    "r": "s",
    "eid": "q0",
    "ts": 1671195120491778413
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > values | y | object |  |  |
| >> [] | y | array |  | List of logs |
| >>> level | y | number | log_level | Log level |
| >>> id | y | string |  | Log message ID |
| >>> msg | y | string |  | Message |
| >>> owner | n | string |  | Message initiator, can be empty string or null |
| >>> t | y | number | epoch_nsec | Time in robot |
| >>> dt | y | number | epoch_nsec | Receive time of backend |

Example:

```json
{
    "type": "robot_logs.subscribe",
    "data": {
        "r_id": "1",
        "values": [
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test3",
                "t": 1671195121000031284,
                "dt": 1671195121001134808
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test1",
                "t": 1671195121000037556,
                "dt": 1671195121001134808
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test",
                "t": 1671195121000041973,
                "dt": 1671195121001134808
            },
            {
                "level": 5,
                "name": "",
                "owner": "1",
                "msg": "without name test2",
                "t": 1671195121000060658,
                "dt": 1671195121001134808
            }
        ]
    },
    "r": "u",
    "eid": "q0",
    "ts": 1671195121002091861
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot_logs.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от логов робота

Отписаться от логов робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"robot_logs.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"robot_logs.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot_logs.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Запрос истории логов робота

Получить историю от даты до даты

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > msg | n | string |  | Message filter mask, max length 256 symbols. Can use “*” for any multiple characters and “.” for any single character |
| > mint | y | string | epoch_nsec | Receive rows “newer” or equal than this value |
| > maxt | y | string | epoch_nsec | Receive rows “older” or equal than this value |
| > lim | n | number |  | Number of rows to receive in range [1, 100000], default value is 100000 |

Example:

```json
{
	"type": "robot_logs.get_history",
	"data": {
		"r_id": "1",
		"msg": "*test2*",
		"maxt": "2000000000000000000",
		"mint": "1",
		"lim": 100
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > values | y | object |  |  |
| >> [] | y | array |  | List of logs |
| >>> name | y | string |  | Portfolio name |
| >>> r_id | y | string |  | Robot ID |
| >>> id | y | string |  | Log message ID |
| >>> level | y | number | log_level | Log level |
| >>> msg | y | string |  | Message |
| >>> owner | n | string |  | Message initiator, can be empty string or null |
| >>> dt | y | number | epoch_nsec | Time in robot |

Example:

```json
{
    "type": "robot_logs.get_history",
    "data": {
        "values": [
            {
                "dt": "1677586103000245321",
                "r_id": "1",
                "name": "test11",
                "level": 1,
                "msg": "Compilation on \"test11\" is OK",
                "owner": ""
            },
            {
                "dt": "1677586099000142947",
                "r_id": "1",
                "name": "test11",
                "level": 2,
                "msg": "can not calculate ratio or count on: test11",
                "owner": ""
            },
            {
                "dt": "1677586098035538311",
                "r_id": "1",
                "name": "test11",
                "level": 0,
                "msg": "Portfolio \"test11\" was added by test@gmail.com",
                "owner": ""
            },
            {
                "dt": "1677055406000165879",
                "r_id": "1",
                "name": "test11",
                "level": 1,
                "msg": "Compilation on \"test11\" is OK",
                "owner": ""
            },
            {
                "dt": "1677055397000150796",
                "r_id": "1",
                "name": "test11",
                "level": 2,
                "msg": "can not calculate ratio or count on: test11",
                "owner": "test@gmail.com"
            }
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1677586620262732080
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot_logs.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot_logs.get_history",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

## Инструменты

### Запрос списка финансовых инструментов

Получить список финансовых инструментов, доступных в данном робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.get_securities | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > reload | n | boolean |  | If true - reloads data from robot, if false (default) - get data from backend |
| > sec_type | n | number |  | Bit mask of sec_types to receive |

Example:

```json
{
	"type": "robot.get_securities",
	"data": {
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.get_securities | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > next | y | boolean |  | If true, client should wait other messages |
| > securities | y | object |  | Securities |
| >> SEC_KEY | y | string:object |  | Security object key |
| >>> sec_key | y | string |  | Security unique key (should be equal to SEC_KEY) |
| >>> sec_key_subscr | y | string |  | Security subscription key on exchange |
| >>> put | y | number |  | Put/Call option: 0 — Call, 1 — put, -1 — other (not an option) |
| >>> step | y | number |  | Price step |
| >>> base_sec_key | y | string |  | Base security unique key |
| >>> sec_board | y | string |  | Security board |
| >>> sec_code | y | string |  | Security code |
| >>> description | y | string |  | Security description |
| >>> sec_type | y | number | sec_type | Security type |
| >>> d_pg | y | number |  | Pagination data |
| >>> isinid_fast | y | number |  |  |
| >>> isinid_p2 | y | number |  |  |
| >>> state | y | number |  | Trading state: 1 — Is trading |
| >>> exec_end | y | number |  | Expiration data |
| >>> strike | y | number |  | Strike (used for options) |
| >>> lot_size | y | number |  | Lot size |

Example:

```json
{
    "type": "robot.get_securities",
    "data": {
        "next": false,
        "securities": {
            "OKF_1INCH_USDT_SWAP": {
                "put": -1,
                "step": 0.0001,
                "sec_key": "OKF_1INCH_USDT_SWAP",
                "sec_key_subscr": "1INCH-USDT-SWAP",
                "base_sec_key": "1INCH-USDT",
                "sec_board": "",
                "sec_code": "1INCH-USDT-SWAP",
                "description": "1INCH-USDT-SWAP",
                "sec_type": 67108864,
                "d_pg": 2147483647,
                "isinid_fast": 11798768020302227088,
                "isinid_p2": 0,
                "state": 1,
                "exec_end": 2147483647,
                "strike": 0,
                "lot_size": 1
            },
            "OKS_ZYRO_USDT": {
                "put": -1,
                "step": 0.00001,
                "sec_key": "OKS_ZYRO_USDT",
                "sec_key_subscr": "ZYRO-USDT",
                "base_sec_key": "",
                "sec_board": "",
                "sec_code": "ZYRO-USDT",
                "description": "ZYRO-USDT",
                "sec_type": 67108864,
                "d_pg": 2147483647,
                "isinid_fast": 13296729603019105325,
                "isinid_p2": 0,
                "state": 1,
                "exec_end": 2147483647,
                "strike": 0,
                "lot_size": 1e-8
            }
        }
    },
    "r": "p",
    "eid": "q0",
    "ts": 1671449845200989442
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.get_securities | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.get_securities",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Запрос списка клиентских кодов

Получить список клиентских кодов, доступных в данном роботе

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.get_client_codes | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "robot.get_client_codes",
	"data": {
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.get_client_codes | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > values | y | object |  |  |
| >> [] | y | array |  |  |
| >>> sec_type | y | number | sec_type | Security type |
| >>> ll | y | string |  | Client code unique label |

Example:

```json
{
    "type": "robot.get_client_codes",
    "data": {
        "r_id": "1",
        "values": [
            {
                "sec_type": 1048576,
                "ll": "bitmex_send_xxx/xxx"
            }
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1677586108933275724
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.get_client_codes | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.get_client_codes",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    



### Найти финансовый инструмент в роботе/портфеле

Найти заданный финансовый инструмент в портфеле или роботе или всех доступных роботах

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.find_security | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | n | string |  | Robot ID |
| > p_id | n | string |  | Portfolio name |
| > key | y | string |  | Security’s SecKey |

Example:

```json
{
	"type": "robot.find_security",
	"data": {
		"r_id": "1",
		"key": "OKF_ADA_USDT_SWAP"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.find_security | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > key | y | string |  | Security’s SecKey |
| > portfolios | y | object |  | Portfolios |
| >> [] | y | array |  | List of portfolios with specified SecKey in securities list |
| >>> r_id | y | string |  | Robot ID |
| >>> p_id | y | string |  | Portfolio name |
| >>> disabled | y | boolean |  | Replacing security in this portfolio is disabled |
| > formulas | y | object |  | Formulas |
| >> [] | y | string |  |  |
| >>> r_id | y | string |  | Robot ID |
| >>> p_id | y | string |  | Portfolio name |
| >>> pos | y | number |  | Integer position of found SecKey in formula field |
| >>> text | y | string |  | Found substring |
| >>> sec | y | string |  | SecKey if substring was found in security formula or an empty string if it was found in portfolio formula |
| >>> title | y | string |  | Field title |
| >>> field | y | string |  | Field name (key) |
| >>> value | y | string |  | Field value |
| >>> disabled | y | boolean |  | Editing of this field is disabled |

Example:

```json
{
    "type": "robot.find_security",
    "data": {
        "key": "OKF_ADA_USDT_SWAP",
        "portfolios": [
            {
                "r_id": "1",
                "p_id": "test3",
                "disabled": false
            }
        ],
        "formulas": [
            {
                "r_id": "1",
                "p_id": "replace",
                "pos": 27,
                "text": "y(\"OKF_ADA_USDT_SWAP\");\nsecurity...",
                "sec": "",
                "title": "Extra field#1",
                "field": "ext_field1_",
                "value": "security s = get_security(\"OKF_ADA_USDT_SWAP\");\nsecurity s1 = get_security(\"OKF_ADA_USDT_SWAP\");",
                "disabled": false
            },
            {
                "r_id": "1",
                "p_id": "replace",
                "pos": 76,
                "text": "y(\"OKF_ADA_USDT_SWAP\");",
                "sec": "",
                "title": "Extra field#1",
                "field": "ext_field1_",
                "value": "security s = get_security(\\OKF_ADA_USDT_SWAP\");\nsecurity s1 = get_security(\"OKF_ADA_USDT_SWAP\");",
                "disabled": false
            },
            {
                "r_id": "1",
                "p_id": "replace",
                "pos": 27,
                "text": "y(\"OKF_ADA_USDT_SWAP\");\nreturn 1...",
                "sec": "OKF_ADA_USDT_SWAP",
                "title": "OKF_ADA_USDT_SWAP#Ratio buy formula",
                "field": "ratio_b_formula",
                "value": "security s = get_security(\"OKF_ADA_USDT_SWAP\");\nreturn 1;",
                "disabled": false
            }
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1672041478409883474
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.find_security | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.find_security",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Заменить финансовый инструмент в портфелях робота

Заменить заданный финансовый инструмент в заданных портфелях данного робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.replace_security | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > key | y | string |  | Old security’s SecKey |
| > new_sec | y | object |  | New security |
| >> sec_key_subscr | y | string |  |  |
| >> sec_key | y | string |  |  |
| >> sec_type | y | number | sec_type |  |
| >> sec_board | y | string |  |  |
| >> sec_code | y | string |  |  |
| > portfolios | y | string |  | List of portfolio names |
| >> [] | y | array |  | List of portfolios with specified SecKey in securities list |
| > formulas | y | object |  | Formulas |
| >> [] | y | string |  |  |
| >>> p_id | y | string |  | Portfolio name |
| >>> pos | y | number |  | Integer position of SecKey in formula field to replace |
| >>> sec | y | string |  | SecKey if field belongs to security field or empty string if field belongs to portfolio field |
| >>> field | y | string |  | Field name (key) |

Example:

```json
{
	"type":"robot.replace_security",
	"data":{
		"r_id":"1",
		"key":"OKF_ADA_USDT_SWAP",
		"new_sec":{"sec_key_subscr":"BTC-USDT-SWAP", "sec_key":"OKF_BTC_USDT_SWAP", "sec_type":67108864, "sec_code":"BTC-USDT-SWAP", "sec_board":""},
		"portfolios":["test3","replace"],
		"formulas":[
			{"p_id":"replace", "sec":"", "field":"ext_field1_", "pos":27},
			{"p_id":"replace", "sec":"", "field":"ext_field1_", "pos":76},
			{"p_id":"replace", "sec":"OKF_ADA_USDT_SWAP", "field":"ratio_b_formula", "pos":27},
		]
	},
	"eid":"qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.replace_security | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | n | object |  |  |

Example:

```json
{
	"type":"robot.replace_security",
	"data":{},
	"r":"p",
	"eid":"q0",
	"ts":1672043554299048407
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.replace_security | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.replace_security",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

## Маркет-дата

### Подписка на маркет-дата подключения робота

Подписаться на обновления статусов маркет-дата подключений робота

В любой момент может быть выслан снапшот

В обновлениях придут ключи (sec_type + name) и измененные поля (stream_state ходит всегда целиком)

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "data_conn.subscribe",
	"data": {
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > values | y | object |  | Portfolio snapshot |
| >> CONN_KEY | y | string:object |  | Connection key string as SEC_TYPE + “_” + CONN_NAME |
| >>> name | y | string |  | Connection name |
| >>> sec_type | y | number | sec_type | Security type |
| >>> bind_ip | y | string |  | Bind IP-address |
| >>> use_in_mc | n | boolean |  | Always true, it is not used and will be removed |
| >>> disabled | y | boolean |  | Disabled connection |
| >>> stream_state | y | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >>> has_sec_man | y | boolean |  | Has security manager |
| >>> sec_manager | y | object |  | Dictionary of symbols to find |
| >>>> SYMBOL | y | string:object |  | Unique symbol to find |
| >>>>> state | y | number | symbol_find_state | State |

Example:

```json
{
    "type": "data_conn.subscribe",
    "data": {
        "r_id": "1",
        "values": {
            "3_FAST BestPrices": {
                "sec_type": 3,
                "name": "FAST BestPrices",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "8_FAST CURR BestPrices": {
                "sec_type": 8,
                "name": "FAST CURR BestPrices",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "8_FAST CURR Definitions": {
                "sec_type": 8,
                "name": "FAST CURR Definitions",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "8_FAST CURR Orderlog": {
                "sec_type": 8,
                "name": "FAST CURR Orderlog",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "4_FAST FOND BestPrices": {
                "sec_type": 4,
                "name": "FAST FOND BestPrices",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "4_FAST FOND Definitions": {
                "sec_type": 4,
                "name": "FAST FOND Definitions",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "4_FAST FOND Orderlog": {
                "sec_type": 4,
                "name": "FAST FOND Orderlog",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "3_FAST Futures Definitions": {
                "sec_type": 3,
                "name": "FAST Futures Definitions",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "17592186044416_FAST INDEXES": {
                "sec_type": 17592186044416,
                "name": "FAST INDEXES",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "3_FAST Options Definitions": {
                "sec_type": 3,
                "name": "FAST Options Definitions",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "3_FAST Orderlog": {
                "sec_type": 3,
                "name": "FAST Orderlog",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "34359738368_binancefut_listen": {
                "sec_type": 34359738368,
                "name": "binancefut_listen",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": false,
		"sec_manager": {}
            },
            "67108864_okex_listen": {
                "sec_type": 67108864,
                "name": "okex_listen",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
                "stream_state": {},
		"has_sec_man": true,
                "stream_state": {"qwe":{"state":4}}
            },
            "67108864_okex_listen_aws": {
                "sec_type": 67108864,
                "name": "okex_listen_aws",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": false,
                "stream_state": {
                    "Definitions": 0,
                    "Extra": 0,
                    "Funding": 0,
                    "OB": 0,
                    "Socket": 1
                },
		"has_sec_man": false,
		"sec_manager": {}
            }
        }
    },
    "r": "s",
    "eid": "q0",
    "ts": 1672318278012852347
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > values | y | object |  | Portfolio snapshot |
| >> CONN_KEY | y | string:object |  | Connection key string as SEC_TYPE + “_” + CONN_NAME |
| >>> name | y | string |  | Connection name |
| >>> sec_type | y | number | sec_type | Security type |
| >>> bind_ip | n | string |  | Bind IP-address |
| >>> use_in_mc | n | boolean |  | It is not used and will be removed |
| >>> disabled | n | boolean |  | Disabled connection |
| >>> stream_state | n | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >>> has_sec_man | n | boolean |  | Has security manager |
| >>> sec_manager | n | object |  | Dictionary of symbols to find |
| >>>> SYMBOL | y | string:object |  | Unique symbol to find |
| >>>>> state | n | number | symbol_find_state | State |

Example:

```json
{
    "type": "data_conn.subscribe",
    "data": {
        "r_id": "1",
        "values": {
            "67108864_okex_listen_aws": {
                "sec_type": 67108864,
                "name": "okex_listen_aws",
                "stream_state": {
                    "Definitions": 1,
                    "Extra": 1,
                    "Funding": 1,
                    "OB": 1,
                    "Socket": 2
                },
		"sec_manager":{"test":1}
            }
        }
    },
    "r": "u",
    "eid": "q0",
    "ts": 1672318279003491758
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"data_conn.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Получить список маркет-дата подключений робота

Получить список маркет-дата подключений робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.get_all | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "data_conn.get_all",
	"data": {
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.get_all | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > values | y | object |  | Portfolio snapshot |
| >> CONN_KEY | y | string:object |  | Connection key string as SEC_TYPE + “_” + CONN_NAME |
| >>> name | y | string |  | Connection name |
| >>> sec_type | y | number | sec_type | Security type |
| >>> sec_type_text | y | string |  | Security type string |
| >>> bind_ip | y | string |  | Bind IP-address |
| >>> use_in_mc | n | boolean |  | Always true, it is not used and will be removed |
| >>> disabled | y | boolean |  | Disabled connection |
| >>> stream_state | n | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >>> has_sec_man | y | boolean |  | Has security manager |
| >>> sec_manager | n | object |  | Dictionary of symbols to find |
| >>>> SYMBOL | y | string:object |  | Unique symbol to find |
| >>>>> state | n | number | symbol_find_state | State |

Example:

```json
{
    "type": "data_conn.get_all",
    "data": {
        "r_id": "1",
        "values": {
            "3_FAST BestPrices": {
                "sec_type": 3,
                "name": "FAST BestPrices",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "8_FAST CURR BestPrices": {
                "sec_type": 8,
                "name": "FAST CURR BestPrices",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "8_FAST CURR Definitions": {
                "sec_type": 8,
                "name": "FAST CURR Definitions",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "8_FAST CURR Orderlog": {
                "sec_type": 8,
                "name": "FAST CURR Orderlog",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "4_FAST FOND BestPrices": {
                "sec_type": 4,
                "name": "FAST FOND BestPrices",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "4_FAST FOND Definitions": {
                "sec_type": 4,
                "name": "FAST FOND Definitions",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "4_FAST FOND Orderlog": {
                "sec_type": 4,
                "name": "FAST FOND Orderlog",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "3_FAST Futures Definitions": {
                "sec_type": 3,
                "name": "FAST Futures Definitions",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "17592186044416_FAST INDEXES": {
                "sec_type": 17592186044416,
                "name": "FAST INDEXES",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "3_FAST Options Definitions": {
                "sec_type": 3,
                "name": "FAST Options Definitions",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "3_FAST Orderlog": {
                "sec_type": 3,
                "name": "FAST Orderlog",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "34359738368_binancefut_listen": {
                "sec_type": 34359738368,
                "name": "binancefut_listen",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "67108864_okex_listen": {
                "sec_type": 67108864,
                "name": "okex_listen",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": true,
		"has_sec_man": false,
                "stream_state": {}
            },
            "67108864_okex_listen_aws": {
                "sec_type": 67108864,
                "name": "okex_listen_aws",
                "bind_ip": "",
                "use_in_mc": true,
                "disabled": false,
		"has_sec_man": false,
                "stream_state": {
                    "Definitions": 0,
                    "Extra": 0,
                    "Funding": 0,
                    "OB": 0,
                    "Socket": 1
                }
            }
        }
    },
    "r": "p",
    "eid": "q0",
    "ts": 1672318278012852347
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.get_all | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"data_conn.get_all",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от маркет-дата подключений робота

Отписаться от обновлений статусов маркет-дата подключений робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"data_conn.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"data_conn.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"data_conn.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Операции с маркет-дата подключениями

Disable/enable/переподключить маркет-дата подключение

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection object |
| >> name | y | string |  | Connection name |
| >> sec_type | y | number | sec_type | Security type |
| >> * | n | * |  | Other connection fields from template |

Example:

```json
{
    "type": "data_conn.update",
    "data": {
        "r_id": "1",
        "conn": {
            "sec_type": 67108864,
            "name": "okex_listen_aws",
            "reconnect": true
        }
    },
    "eid": "qwerty"
}
```
    
```json
{
    "type": "data_conn.update",
    "data": {
        "r_id": "1",
        "conn": {
            "sec_type": 67108864,
            "name": "okex_listen_aws",
            "disabled": true
        }
    },
    "eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  | Empty dict |

Example:

```json
{
	"type":"data_conn.update",
	"data":
	{
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"data_conn.update",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

### Добавить/удалить бумагу в менеджер бумаг

Добавить/удалить бумагу в менеджер бумаг

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.add_symbol/del_symbol | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection object |
| >> name | y | string |  | Connection name |
| >> sec_type | y | number | sec_type | Security type |
| >> symbol | y | string |  | Symbol to add/del |

Example:

```json
{
	"type":"data_conn.add_symbol",
	"data":
	{
		"sec_type":2048,
		"name":"cqg_listen_roma",
		"symbol":"F.US.EPZ2"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.add_symbol/del_symbol | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"data_conn.del_symbol",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.add_symbol/del_symbol | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"data_conn.add_symbol",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>  

### Найти бумагу для менеджера бумаг

Найти бумагу для менеджера бумаг

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.find_symbol | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection object |
| >> name | y | string |  | Connection name |
| >> sec_type | y | number | sec_type | Security type |
| >> symbol | y | string |  | Symbol to add/del |

Example:

```json
{
	"type":"data_conn.find_symbol",
	"data":
	{
		"sec_type":2048,
		"name":"cqg_listen_roma",
		"symbol":"F.US.EPZ2"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.find_symbol | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > found | y | string |  | Found symbol |
| > warn | y | string |  | Warning (empty string if no warning) |

Example:

```json
{
	"type":"data_conn.find_symbol",
	"data":{"found":"F.US.EPU23","warn":"Security expired"},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = data_conn.find_symbol | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"find_symbol",
	"data":
	{
		"msg":"Requested symbol .US.EPU23 was not found",
		"code":777
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>

## Транзакционные подключения

### Добавить транзакционное подключение

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.add_trans_conn | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection object |
| >> name | y | string |  | Connection short name |
| >> exchane | y | string |  | Security type |
| >> bind_ip | y | string |  | Bind IP |
| >> * | n | * |  | Other connection fields from template |

Example:

```json
{
    "type": "robot.add_trans_conn",
    "data": {
        "r_id": "1",
        "conn": {
            "exchange": "1048576",
            "name": "qwe",
            "ws_id": "1",
            "ws_secret_part": "2",
            "add_id": "3",
            "add_secret_part": "4",
            "bind_ip": "automatic",
            "ckey": "12345678",
        }
    },
    "eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.add_trans_conn | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > name | y | string |  | Connection short name |
| > sec_type | y | number | sec_type | Security type |

Example:

```json
{
    "type": "robot.add_trans_conn",
    "data": {
        "r_id": "1",
        "sec_type": 1048576,
        "name": "qwe"
    },
    "r": "p",
    "eid": "q0",
    "ts": 1683010843351601412
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.add_trans_conn | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.add_trans_conn",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Изменить транзакционное подключение

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.edit | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection object |
| >> name | y | string |  | Connection short name |
| >> exchane | y | string |  | Security type |
| >> bind_ip | y | string |  | Bind IP |
| >> * | n | * |  | Other connection fields from template |

Example:

```json
{
    "type": "trans_conn.edit",
    "data": {
        "r_id": "1",
        "conn": {
            "exchange": "1048576",
            "name": "qwe",
            "ws_id": "1",
            "ws_secret_part": "2",
            "add_id": "3",
            "add_secret_part": "4",
            "bind_ip": "automatic",
            "ckey": "12345678",
        }
    },
    "eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.edit | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > name | y | string |  | Connection short name |
| > sec_type | y | number | sec_type | Security type |

Example:

```json
{
    "type": "trans_conn.edit",
    "data": {
        "r_id": "1",
        "sec_type": 1048576,
        "name": "qwe"
    },
    "r": "p",
    "eid": "q0",
    "ts": 1683010843351601412
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.edit | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn.edit",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Удалить транзакционное подключение

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.remove | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection object |
| >> name | y | string |  | Connection short name |
| >> sec_type | y | number | sec_type | Security type |

Example:

```json
{
    "type": "trans_conn.remove",
    "data": {
        "r_id": "1",
        "conn": {
            "sec_type": 67108864,
            "name": "aws"
        }
    },
    "eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.remove | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > name | y | string |  | Connection short name |
| > sec_type | y | number | sec_type | Security type |

Example:

```json
{
    "type": "trans_conn.remove",
    "data": {
        "sec_type": 1048576,
        "name": "qwe",
        "r_id": "1"
    },
    "r": "p",
    "eid": "q0",
    "ts": 1683011092645083338
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.remove | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn.remove",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Получить параметры транзакционного подключения

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection object |
| >> name | y | string |  | Connection short name |
| >> sec_type | y | number | sec_type | Security type |

Example:

```json
{
    "type": "trans_conn.get",
    "data": {
        "r_id": "1",
        "conn": {
            "sec_type": 67108864,
            "name": "aws"
        }
    },
    "eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection |
| >> name | y | string |  | Connection short name |
| >> sec_type | y | number | sec_type | Security type |
| >> * | n | * |  | Other connection fields |

Example:

```json
{
    "type": "trans_conn.get",
    "data": {
        "r_id": "1",
        "conn": {
            "exchange": "1048576",
            "sec_type": 1048576,
            "current_bind_ip": "0.0.0.0",
            "name": "qwe",
            "ws_id": "1",
            "ws_secret_part": "2",
            "add_id": "3",
            "add_secret_part": "4",
            "bind_ip": "automatic"
        }
    },
    "r": "p",
    "eid": "q0",
    "ts": 1683118963003758829
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn.get",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Получить бумаги, торгуемые через транзакционное подключение

Получить бумаги, которые есть в портфелях робота и у которых client code относится именно в данному подключению

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection object |
| >> name | y | string |  | Connection short name |
| >> sec_type | y | number | sec_type | Security type |

Example:

```json
{
    "type": "trans_conn.get_used_secs",
    "data": {
        "r_id": "1",
        "conn": {
            "sec_type": 67108864,
            "name": "aws"
        }
    },
    "eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get_used_secs | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > contracts | y | object |  |  |
| >> SEC_KEY | y | string |  | Security key |
| >>> step | y | number |  | Price step |
| >>> sec_key | y | string |  | Security key |
| >>> sec_key_subscr | y | string |  | Security subscription key |
| >>> sec_code | y | string |  | Security description |
| >>> coin | y | string |  | Base coin |
| >>> bid | y | number |  | Bid price |
| >>> offer | y | number |  | Offer price |
| >>> decimals | y | number |  | Decimal digits in price |

Example:

```json
{
    "type": "trans_conn.get_used_secs",
    "data": {
        "contracts": {
            "VT_BTCUSD": {
                "step": 0.5,
                "sec_key": "VT_BTCUSD",
                "sec_key_subscr": "1",
                "sec_code": "BTC/USD contract",
                "coin": "",
                "bid": 35000,
                "offer": 36000,
                "decimals": 1
            }
        },
        "r": "p",
        "eid": "q0",
        "ts": 1688720510426841957
    }
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get_used_secs | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn.get_used_secs",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Подписка на транзакционные подключения робота

Подписаться на обновления статусов транзакционных подключений робота

В любой момент может быть выслан снапшот

В обновлениях придут ключи (sec_type + name) и измененные поля (stream_state и speed_info ходят всегда целиком)

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "trans_conn.subscribe",
	"data": {
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > values | y | object |  | Portfolio snapshot |
| >> CONN_KEY | y | string:object |  | Connection key string as SEC_TYPE + “_” + CONN_NAME |
| >>> name | y | string |  | Connection short name |
| >>> sec_type | y | number | sec_type | Security type |
| >>> full_name | y | string |  | Connection long name |
| >>> trans_cnt | y | number |  | Today transactions count |
| >>> bind_ip | n | string |  | Bind IP-address (default value “0.0.0.0”) |
| >>> bind_ip_type | n | string |  | “static” or “automatic” (default value “automatic”) |
| >>> use_in_mc | n | boolean |  | Always true, it is not used and will be removed |
| >>> can_check_pos | y | boolean |  | Can show active orders |
| >>> has_pos | n | boolean |  | Can receive positions (default false) |
| >>> disabled | y | boolean |  | Disabled connection |
| >>> stream_state | n | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >>> speed_info | n | object |  | Dictionary TODO |

Example:

```json
{
    "type": "trans_conn.subscribe",
    "data": {
        "r_id": "1",
        "values": {
            "1048576_roma": {
                "sec_type": 1048576,
                "name": "roma",
                "full_name": "bitmex_send_roma",
                "trans_cnt": 0,
                "use_in_mc": true,
                "can_check_pos": true,
                "disabled": false,
                "speed_info": {
                    "m0": 0,
                    "m05": 0,
                    "m1": 0,
                    "m2": 0,
                    "m4": 0,
                    "m8": 0,
                    "m16": 0,
                    "l05a": 0,
                    "l05d": 0,
                    "l05m": 0,
                    "l05ra": 0
                },
                "stream_state": {
                    "Margin": 0,
                    "Orders": 0,
                    "Positions": 0,
                    "Socket": 2,
                    "Trades": 0
                },
                "bind_ip": "0.0.0.0",
                "bind_ip_type": "automatic",
                "has_pos": true
            },
            "0_virtual": {
                "sec_type": 0,
                "name": "virtual",
                "full_name": "virtual",
                "trans_cnt": 0,
                "use_in_mc": false,
                "can_check_pos": false,
                "disabled": false,
                "speed_info": {
                    "m0": 0,
                    "m05": 0,
                    "m1": 0,
                    "m2": 0,
                    "m4": 0,
                    "m8": 0,
                    "m16": 0,
                    "l05a": 0,
                    "l05d": 0,
                    "l05m": 0,
                    "l05ra": 0
                },
                "stream_state": {
                    "TRANS": 2
                }
            }
        }
    },
    "r": "s",
    "eid": "q0",
    "ts": 1674041060021346958
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > values | y | object |  | Portfolio snapshot |
| >> CONN_KEY | y | string:object |  | Connection key string as SEC_TYPE + “_” + CONN_NAME |
| >>> name | y | string |  | Connection short name |
| >>> sec_type | y | number | sec_type | Security type |
| >>> full_name | y | string |  | Connection long name |
| >>> trans_cnt | n | number |  | Today transactions count |
| >>> bind_ip | n | string |  | Bind IP-address (default value “0.0.0.0”) |
| >>> bind_ip_type | n | string |  | “static” or “automatic” (default value “automatic”) |
| >>> use_in_mc | n | boolean |  | Always true, it is not used and will be removed |
| >>> can_check_pos | n | boolean |  | Can show active orders |
| >>> has_pos | n | boolean |  | Can receive positions |
| >>> disabled | n | boolean |  | Disabled connection |
| >>> stream_state | n | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >>> speed_info | n | object |  | Dictionary TODO |
| >>> __action = del | n | string |  | Only on delete |

Example:

```json
{
    "type": "trans_conn.subscribe",
    "data": {
        "r_id": "1",
        "values": {
            "0_virtual": {
                "sec_type": 0,
                "name": "virtual",
                "full_name": "virtual",
                "stream_state": {
                    "TRANS": 2
                }
            }
        }
    },
    "r": "u",
    "eid": "q0",
    "ts": 1673868870003507686
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get_all | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn.get_all",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Получить список транзакционных подключений робота

Получить список транзакционных подключений робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get_all | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "trans_conn.get_all",
	"data": {
		"r_id": "1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get_all | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > values | y | object |  | Portfolio snapshot |
| >> CONN_KEY | y | string:object |  | Connection key string as SEC_TYPE + “_” + CONN_NAME |
| >>> name | y | string |  | Connection short name |
| >>> sec_type | y | number | sec_type | Security type |
| >>> full_name | y | string |  | Connection long name |
| >>> trans_cnt | y | number |  | Today transactions count |
| >>> bind_ip | n | string |  | Bind IP-address (default value “0.0.0.0”) |
| >>> bind_ip_type | n | string |  | “static” or “automatic” (default value “automatic”) |
| >>> use_in_mc | n | boolean |  | Always true, it is not used and will be removed |
| >>> can_check_pos | y | boolean |  | Can show active orders |
| >>> has_pos | n | boolean |  | Can receive positions (default false) |
| >>> disabled | y | boolean |  | Disabled connection |
| >>> stream_state | n | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >>> speed_info | n | object |  | Dictionary TODO |

Example:

```json
{
    "type": "trans_conn.get_all",
    "data": {
        "r_id": "1",
        "values": {
            "1048576_roma": {
                "sec_type": 1048576,
                "name": "roma",
                "full_name": "bitmex_send_roma",
                "trans_cnt": 0,
                "use_in_mc": true,
                "can_check_pos": true,
                "disabled": false,
                "speed_info": {
                    "m0": 0,
                    "m05": 0,
                    "m1": 0,
                    "m2": 0,
                    "m4": 0,
                    "m8": 0,
                    "m16": 0,
                    "l05a": 0,
                    "l05d": 0,
                    "l05m": 0,
                    "l05ra": 0
                },
                "stream_state": {
                    "Margin": 0,
                    "Orders": 0,
                    "Positions": 0,
                    "Socket": 2,
                    "Trades": 0
                },
                "bind_ip": "0.0.0.0",
                "bind_ip_type": "automatic",
                "has_pos": true
            },
            "0_virtual": {
                "sec_type": 0,
                "name": "virtual",
                "full_name": "virtual",
                "trans_cnt": 0,
                "use_in_mc": false,
                "can_check_pos": false,
                "disabled": false,
                "speed_info": {
                    "m0": 0,
                    "m05": 0,
                    "m1": 0,
                    "m2": 0,
                    "m4": 0,
                    "m8": 0,
                    "m16": 0,
                    "l05a": 0,
                    "l05d": 0,
                    "l05m": 0,
                    "l05ra": 0
                },
                "stream_state": {
                    "TRANS": 2
                }
            }
        }
    },
    "r": "p",
    "eid": "q0",
    "ts": 1674041060021346958
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.get_all | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn.get_all",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от транзакционных подключений робота

Отписаться от обновлений статусов транзакционных подключений робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"trans_conn.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"trans_conn.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Подписка на активные заявки транзакционного подключения робота

Подписаться на активные заявки транзакционного подключения робота

В любой момент может быть выслан снапшот

При удалении подключения произойдет отписка

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  |  |
| >> sec_type | y | number | sec_type | Security type |
| >> name | y | string |  | Connection short name |

Example:

```json
{
	"type": "trans_conn_orders.subscribe",
	"data": {
		"r_id": "1",
		"conn":
		{
			"sec_type":1048576,
			"name":"roma"
		}
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > value | y | object |  | Portfolio snapshot |
| >> name | y | string |  | Connection short name |
| >> sec_type | y | number | sec_type | Security type |
| >> full_name | y | string |  | Connection long name |
| >> disabled | y | boolean |  | Disabled connection |
| >> stream_state | y | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >> active_orders | y | string:object |  | Dictionary of active orders |
| >>> ORDER_ID | y | string |  | Unique order ID |
| >>>> sk | y | string |  | Security key |
| >>>> cc | y | string |  | Order’s client code |
| >>>> subscr | y | string |  | Security subscription key |
| >>>> ono | y | string |  | Unique order ID |
| >>>> id | y | string |  | Order’s ext_id |
| >>>> p | y | number |  | Price |
| >>>> q | y | number |  | Integer quantity |
| >>>> q0 | y | number |  | Integer left quantity |
| >>>> d | y | number | direction | Direction |
| >>>> decimals | y | number |  | Decimal places in price |
| >>>> t | y | string | epoch_nsec | Order update time |
| >>>> r | y | boolean |  | Robot’s order or not |

Example:

```json
{
  "type": "trans_conn_orders.subscribe",
  "data": {
    "r_id": "1",
    "value": {
      "sec_type": 1048576,
      "name": "roma",
      "full_name": "bitmex_send_roma",
      "disabled": false,
      "active_orders": {
        "1de6bd60-688c-4777-bd17-aef921888290": {
          "sk": "BM_XBTUSD",
          "cc": "",
          "subscr": "XBTUSD",
          "ono": "1de6bd60-688c-4777-bd17-aef921888290",
          "id": "",
          "p": 21228,
          "q": 100,
          "q0": 100,
          "d": 2,
          "decimals": 8,
          "t": "1674203817310000000",
          "r": false
        }
      },
      "stream_state": {
        "Margin": 2,
        "Orders": 2,
        "Positions": 2,
        "Socket": 2,
        "Trades": 2
      }
    }
  },
  "r": "s",
  "eid": "q0",
  "ts": 1674218608752679113
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > value | y | object |  | Portfolio snapshot |
| >> name | y | string |  | Connection short name |
| >> sec_type | y | number | sec_type | Security type |
| >> full_name | y | string |  | Connection long name |
| >> disabled | n | boolean |  | Disabled connection |
| >> stream_state | n | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >> active_orders | n | string:object |  | Dictionary of active orders |
| >>> ORDER_ID | n | string |  | Unique order ID |
| >>>> sk | n | string |  | Security key |
| >>>> cc | n | string |  | Order’s client code |
| >>>> subscr | n | string |  | Security subscription key |
| >>>> ono | n | string |  | Unique order ID |
| >>>> id | n | string |  | Order’s ext_id |
| >>>> p | n | number |  | Price |
| >>>> q | n | number |  | Integer quantity |
| >>>> q0 | n | number |  | Integer left quantity |
| >>>> d | n | number | direction | Direction |
| >>>> decimals | n | number |  | Decimal places in price |
| >>>> t | n | string | epoch_nsec | Order update time |
| >>>> r | n | boolean |  | Robot’s order or not |
| >>>> __action = del | n | string |  | Only on delete |

Example:

```json
{
    "type": "trans_conn_orders.subscribe",
    "data": {
        "r_id": "1",
        "value": {
            "sec_type": 1048576,
            "name": "roma",
            "full_name": "bitmex_send_roma",
            "active_orders": {
                "1de6bd60-688c-4777-bd17-aef921888290": {
                    "__action": "del"
                }
            }
        }
    },
    "r": "u",
    "eid": "q0",
    "ts": 1674219741002098084
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn_orders.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от активных заявок транзакционного подключения робота

Отписаться от активные заявки транзакционного подключения робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"trans_conn_orders.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"trans_conn_orders.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn_orders.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Снять активную заявку на транзакционном подключении робота

Снять активную заявку на транзакционном подключении робота. Успешный ответ означает только то, что данное сообщение успешно получено роботом, но это не означает, что заявка успешно снята и т.п. Сообщения об успешности или не успешности снятия заявки ходят в логе

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.cancel | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > order | y | object |  |  |
| >> sec_type | y | number | sec_type | Security type |
| >> name | y | string |  | Connection short name |
| >> cc | y | string |  | Order’s client code |
| >> subscr | y | string |  | Security subscription key |
| >> ono | y | string |  | Unique order ID |
| >> id | y | string |  | Order’s ext_id |
| >> d | y | number | direction | Direction |

Example:

```json
{
	"type": "trans_conn_orders.cancel",
	"data": {
		"r_id": "1",
		"order":
		{
			"sec_type": 33554432,
			"name": "qwe",
			"ono": "16301618769",
			"subscr": "BTC-PERPETUAL",
			"cc": "",
			"id": "0",
			"d": 1
		}
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.cancel | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > sec_type | y | number | sec_type | Security type |
| > name | y | string |  | Connection short name |
| > cc | y | string |  | Order’s client code |
| > subscr | y | string |  | Security subscription key |
| > ono | y | string |  | Unique order ID |
| > id | y | string |  | Order’s ext_id |
| > d | y | number | direction | Direction |

Example:

```json
{
  "type": "trans_conn_orders.cancel",
  "data": {
    "r_id": "1",
    "sec_type": 33554432,
    "name": "qwe",
    "subscr": "BTC-PERPETUAL",
    "ono": "16301618769",
    "id": "0",
    "cc": "",
    "d": 1
  },
  "r": "p",
  "eid": "q0",
  "ts": 1683801781527007440
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_orders.cancel | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn_orders.cancel",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Подписка на позиции транзакционного подключения робота

Подписаться на позиции транзакционного подключения робота

В любой момент может быть выслан снапшот

При удалении подключения произойдет отписка

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  |  |
| >> sec_type | y | number | sec_type | Security type |
| >> name | y | string |  | Connection short name |

Example:

```json
{
	"type": "trans_conn_poses.subscribe",
	"data": {
		"r_id": "1",
		"conn":
		{
			"sec_type":1048576,
			"name":"roma"
		}
	},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > value | y | object |  | Portfolio snapshot |
| >> name | y | string |  | Connection short name |
| >> sec_type | y | number | sec_type | Security type |
| >> full_name | y | string |  | Connection long name |
| >> disabled | y | boolean |  | Disabled connection |
| >> stream_state | y | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >> both_pos | y | boolean |  | How to display coin pos |
| >> sec_pos | y | string:object |  | Dictionary of security positions |
| >>> SEC_KEY | n | string |  | Unique security key |
| >>>> symbol | n | string |  | Security name |
| >>>> pos | n | number |  | Position |
| >>>> pos_lag | n | number |  | Allowable position difference |
| >>>> pos_eq | n | boolean |  | Check position equality |
| >>>> tgr | n | boolean |  | Send telegram notifications |
| >>>> robot_pos | n | number |  | Robot position |
| >>>> mark_price | n | number |  | Marker price |
| >>>> liq_price | n | number |  | Liquidation price |
| >> coin_pos | y | string:object |  | Dictionary of security positions |
| >>> COIN_KEY | n | string |  | Unique coin key |
| >>>> symbol | n | string |  | Coin name |
| >>>> pos | n | number |  | Position |
| >>>> pos_lag | n | number |  | Allowable position difference |
| >>>> pos_eq | n | boolean |  | Check position equality |
| >>>> tgr | n | boolean |  | Send telegram notifications |
| >>>> robot_pos | n | number |  | Robot position |
| >>>> mark_price | n | number |  | Marker price |
| >>>> liq_price | n | number |  | Liquidation price |

Example:

```json
{
    "type": "trans_conn_poses.subscribe",
    "data": {
        "r_id": "1",
        "value": {
            "sec_type": 1048576,
            "name": "roma",
            "full_name": "bitmex_send_roma",
            "both_pos": false,
            "disabled": false,
            "sec_pos": {
                "ADAH23": {
                    "symbol": "BM_ADAH23",
                    "pos": 0,
                    "pos_lag": 99999999999999,
                    "pos_eq": false,
                    "tgr": false,
                    "robot_pos": 0,
                    "mark_price": -1,
                    "liq_price": -1
                }
            },
            "coin_pos": {
                "USDT": {
                    "pos": 1000,
                    "pos_lag": 999999999,
                    "pos_eq": false,
                    "tgr": false
                },
                "XBT": {
                    "pos": 0.10791494,
                    "pos_lag": 999999999,
                    "pos_eq": false,
                    "tgr": false
                }
            },
            "stream_state": {
                "Margin": 2,
                "Orders": 2,
                "Positions": 2,
                "Socket": 2,
                "Trades": 2
            }
        }
    },
    "r": "s",
    "eid": "q0",
    "ts": 1674220093555976366
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > value | y | object |  | Portfolio snapshot |
| >> name | y | string |  | Connection short name |
| >> sec_type | y | number | sec_type | Security type |
| >> full_name | y | string |  | Connection long name |
| >> disabled | n | boolean |  | Disabled connection |
| >> stream_state | n | object |  | Dictionary of data-stream states with stream name as a key and value of type stream_status |
| >> both_pos | n | boolean |  | How to display coin pos |
| >> sec_pos | n | string:object |  | Dictionary of security positions |
| >>> SEC_KEY | n | string |  | Unique security key |
| >>>> symbol | n | string |  | Security name |
| >>>> pos | n | number |  | Position |
| >>>> pos_lag | n | number |  | Allowable position difference |
| >>>> pos_eq | n | boolean |  | Check position equality |
| >>>> tgr | n | boolean |  | Send telegram notifications |
| >>>> robot_pos | n | number |  | Robot position |
| >>>> mark_price | n | number |  | Marker price |
| >>>> liq_price | n | number |  | Liquidation price |
| >>>> __action = del | n | string |  | Only on delete |
| >> coin_pos | n | string:object |  | Dictionary of security positions |
| >>> COIN_KEY | n | string |  | Unique coin key |
| >>>> symbol | n | string |  | Coin name |
| >>>> pos | n | number |  | Position |
| >>>> pos_lag | n | number |  | Allowable position difference |
| >>>> pos_eq | n | boolean |  | Check position equality |
| >>>> tgr | n | boolean |  | Send telegram notifications |
| >>>> robot_pos | n | number |  | Robot position |
| >>>> mark_price | n | number |  | Marker price |
| >>>> liq_price | n | number |  | Liquidation price |
| >>>> __action = del | n | string |  | Only on delete |

Example:

```json
{
    "type": "trans_conn_poses.subscribe",
    "data": {
        "r_id": "1",
        "value": {
            "sec_type": 1048576,
            "name": "roma",
            "full_name": "bitmex_send_roma",
            "sec_pos": {
                "XBTUSD": {
                    "symbol": "BM_XBTUSD",
                    "pos": 0,
                    "pos_lag": 99999999999999,
                    "pos_eq": false,
                    "tgr": false,
                    "robot_pos": 0,
                    "mark_price": 21129.9,
                    "liq_price": -1
                }
            }
        }
    },
    "r": "u",
    "eid": "q0",
    "ts": 1674220096001698531
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn_poses.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от позиций транзакционного подключения робота

Отписаться от позиций транзакционного подключения робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"trans_conn_poses.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"trans_conn_poses.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn_poses.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Изменить параметры позиций транзакционного подключения робота

Успешный ответ означает что запрос дошел до робота и изменяемые параметры имеют допустимые значения, новые значения полей придут в обновлении позиций (если вы на них подписаны)

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.update_sec_pos/trans_conn_poses.update_coin_pos | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > pos | y | object |  |  |
| >> sec_type | y | number | sec_type | Security type |
| >> name | y | string |  | Connection short name |
| >> key | y | string |  | Unique position key |
| >> * | n |  |  | Field to update |

Example:

```json
{
	"type": "trans_conn_poses.update_sec_pos",
	"data": {
		"r_id": "1",
		"pos":
		{
			"sec_type": 33554432,
			"name": "qwe",
			"key": "BTC-PERPETUAL",
			"pos_lag": 10
		}
	},
	"eid": "qwerty"
}
```
    
```json
{
	"type": "trans_conn_poses.update_coin_pos",
	"data": {
		"r_id": "1",
		"pos":
		{
			"sec_type": 33554432,
			"name": "qwe",
			"key": "BTC",
			"pos_lag": 10
		}
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.update_sec_pos/trans_conn_poses.update_coin_pos | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
    "type": "trans_conn_poses.update_sec_pos",
    "data": {
        "r_id": "1"
    },
    "r": "p",
    "eid": "q0",
    "ts": 1683898111866793521
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.update_sec_pos/trans_conn_poses.update_coin_pos | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn_poses.update_sec_pos",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Выравнять позицию по бумаге/валюте на транзакционном подключении

Успешный ответ означает только то, что данное сообщение успешно получено роботом, но это не означает, что заявка успешно выставлена. Сообщения об успешности или не успешности выставления заявки ходят в логе

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.add_order | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > order | y | object |  |  |
| >> sec_type | y | number | sec_type | Security type |
| >> name | y | string |  | Connection short name |
| >> key_subscr | y | string |  | Security’s subscription key |
| >> dir | y | number | direction | Order direction |
| >> oc | y | number |  | 1 — open position, 2 — close position |
| >> cc | y | string |  | Client code |
| >> amount | y | number |  | Order amount (always integer) |
| >> price | y | number |  | Order price |

Example:

```json
{
	"type": "trans_conn_poses.add_order",
	"data": {
		"r_id": "1",
		"order":
		{
			"sec_type": 33554432,
			"name": "qwe",
			"key_subscr": "BTC-PERPETUAL",
			"dir": 1,
			"oc": 1,
			"cc": "",
			"amount": 10,
			"price": 28000
		}
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.add_order | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
    "type": "trans_conn_poses.add_order",
    "data": {
        "r_id": "1"
    },
    "r": "p",
    "eid": "q0",
    "ts": 1683898111866793521
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn_poses.add_order | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn_poses.add_order",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Операции с транзакционными подключениями

Disable/enable/переподключить транзакционное подключение

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > conn | y | object |  | Connection object |
| >> name | y | string |  | Connection short name |
| >> sec_type | y | number | sec_type | Security type |
| >> * | n | * |  | Other connection fields from template |

Example:

```json
{
    "type": "trans_conn.update",
    "data": {
        "r_id": "1",
        "conn": {
            "sec_type": 67108864,
            "name": "aws",
            "reconnect": true
        }
    },
    "eid": "qwerty"
}
```
    
```json
{
    "type": "trans_conn.update",
    "data": {
        "r_id": "1",
        "conn": {
            "sec_type": 67108864,
            "name": "aws",
            "disabled": true
        }
    },
    "eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  | Empty dict |

Example:

```json
{
	"type":"trans_conn.update",
	"data":
	{
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669806718085368646
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = trans_conn.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"trans_conn.update",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Выслать вторые части ключей транзакционных подключений

При подключении/переподключении робота к бекенду на фронтенд будет отправлено сообщение (сообщения отправляются только в те сессии, которые подписаны на данного робота) о том, что фронтенду необходимо прислать части зашифрованных параметров подключений для данного робота. В ответ фронтенд должен выслать то, что от него просят

<details>
<summary>Update</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.get_trans_conn_keys | y | string |  | Operation type |
| eid = null | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
    "type": "robot.get_trans_conn_keys",
    "data": {
        "r_id": "1"
    },
    "r": "u",
    "eid": null,
    "ts": 1683033706186683818
}
```
</details>    
<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.trans_conn_keys | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > ckeys | y | object |  | Connection object |
| >> [] | y | string |  | List of string keys, length of each key should be 72 symbols |

Example:

```json
{
    "type": "robot.trans_conn_keys",
    "data": {
        "r_id": "1",
        "ckeys": [
            "aaaaaaaaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        ]
    },
    "eid": "zxc"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.trans_conn_keys | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
    "type": "robot.trans_conn_keys",
    "data": {
        "r_id": "1"
    },
    "r": "p",
    "eid": "zxc",
    "ts": 1683105383212294700
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = robot.trans_conn_keys | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r=e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"robot.trans_conn_keys",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

## Фронт

### Запрос идентификатора шаблона объекта

Получить идентификатор шаблона для заданного объекта

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_template_id | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > view | y | string |  | View ID |
| > id | y | object |  | Object ID |
| >> r_id | n | string |  | Robot ID |
| >> p_id | n | string |  | Portfolio name |

Example:

```json
{
	"type": "get_template_id",
	"data": {
		"view": "portfolio",
		"id": {
			"r_id": "1",
			"p_id": "test"
		}
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_template_id | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > template_id | y | string |  | Template ID |

Example:

```json
{
	"type":"get_template_id",
	"data":
	{
		"template_id":"3"
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_template_id | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"get_template_id",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Запрос шаблона по его идентификатору

Получить шаблон для заданного объекта

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_template_by_id | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > template_id | y | string |  | Template ID |

Example:

```json
{
	"type": "get_template_by_id",
	"data": {
		"template_id": "3"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_template_by_id | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > template | y | object |  | Template |

Example:

```json
{
	"type":"get_templateby_id",
	"data":
	{
		"template":
		{
			"template_fields":
			{
				"portfolio":
				[
					{"field":"name","title":"Name","is_key":true,"_comment":"Specify value check","formatter":"string","max_len":30,"default":"","visible":true,"disabled":false}
				],
				"security":
				[
					{"field":"sec_key","title":"SecKey","is_key":true,"formatter":"string","default":"","visible":true,"disabled":false}
				]
			}
		}
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_template_by_id | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"get_template_by_id",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Запрос шаблона нового портфеля

Получить шаблон для нового портфеля

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_new_portfolio_template | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | n | string |  | Robot ID |
| > p_id | n | string |  | Portfolio name |

Example:

```json
{
	"type": "get_new_portfolio_template",
	"data": {
		"r_id": "1",
		"p_id": "test"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_new_portfolio_template | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > template | y | object |  | Template |

Example:

```json
{
	"type":"get_new_portfolio_template",
	"data":
	{
		"template":
		{
			"template_fields":
			{
				"portfolio":
				[
					{"field":"name","title":"Name","is_key":true,"_comment":"Specify value check","formatter":"string","max_len":30,"default":"","visible":true,"disabled":false}
				],
				"security":
				[
					{"field":"sec_key","title":"SecKey","is_key":true,"formatter":"string","default":"","visible":true,"disabled":false}
				]
			}
		}
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_new_portfolio_template | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"get_new_portfolio_template",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Запрос доступных sec_type

Получить список доступных sec_type

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_sec_types | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |

Example:

```json
{
	"type": "get_sec_types",
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_sec_types | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > sec_types | y | array |  | List of sec_types |
| >> [] | y | object |  |  |
| >>> id | y | number | sec_type | Unique sec_type id |
| >>> value | y | string |  | String name |

Example:

```json
{
	"type":"get_sec_types",
	"data":
	{
		"sec_types":
		{
			{"id": 0, "value": "ANY"},
			{"id": 1, "value": "MOEX_OPT"},
			{"id": 2, "value": "MOEX_FUT"}
		}
	},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = get_sec_types | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"get_sec_types",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

## Управление роботом

### Включить робота [роль: admin]

Включить робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.start_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "adm_robot.start_robot",
	"data": {"r_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.start_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |

Example:

```json
{
	"type":"adm_robot.start_robot",
	"data":{},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.start_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.start_robot",
	"data":
	{
		"msg":"Internal error: Error starting robot 1",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Выключить робота [роль: admin]

Выключить робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.stop_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "adm_robot.stop_robot",
	"data": {"r_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.stop_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |

Example:

```json
{
	"type":"adm_robot.stop_robot",
	"data":{},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.stop_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.stop_robot",
	"data":
	{
		"msg":"Internal error: Robot 1 was not stopped",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    


### Перезапустить робота [роль: admin]

Перезапустить не торгующего робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.restart_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "adm_robot.restart_robot",
	"data": {"r_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.restart_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |

Example:

```json
{
	"type":"adm_robot.restart_robot",
	"data":{},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.restart_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.restart_robot",
	"data":
	{
		"msg":"Internal error: Robot 1 was not stopped",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Создать робота на сервере [роль: admin]

Создать робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.add_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > ll | y | string |  | Label (Name) |
| > c_id | y | string |  | Company unique ID |
| > cmnt | y | string |  | Comment |
| > mtc | y | number |  | Robot transaction connections limit |
| > ips | y | array |  | List of ips as list of strings |
| > ld | y | number |  | Log days |
| > cmd | y | string |  | Command line params |
| > srv | y | string |  | Server name |
| > bld | y | string |  | Build name |
| > start | y | boolean |  | Robot should be started |
| > srv_runme | y | boolean |  | Use runme on server |
| > exp | y | number | epoch_sec | Robot expiration |

Example:

```json
{
	"type":"adm_servers.add_robot",
	"data":
	{
		"r_id":"10",
		"ll":"Robot name",
		"c_id":"1",
		"cmnt":"Comment",
		"ips":[],
		"ld":6,
		"cmd":"--cpu=2 --to=config_prod/inner_test.xml",
		"srv": "local",
		"start":true,
		"srv_runme":true,
		"bld":"vikingrobot.vrb_test",
		"mtc":10,
		"exp":2000000001
	},
	"eid":"qwe"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.add_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{"type":"*adm_servers.add_robot*","data":{},"r":"p","eid":"q0","ts":1689672324736098034}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.add_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_servers.add_robot",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    


### Изменить робота [роль: admin]

Поля робота поделены на группы, нельзя одновременно менять поля, относящиеся к разным группам

При изменении некоторых полей робот будет автоматически перезапущен

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > ll | n | string |  | Label |
| > cmnt | n | string |  | Comment |
| > mtc | n | number |  | Robot transaction connections limit |
| > ips | n | array |  | List of ips as list of strings |
| > ld | n | number |  | Log days |
| > cmd | n | string |  | Command line params |
| > srv | n | string |  | Server name |
| > bld | n | string |  | Build name |
| > srv_runme | n | boolean |  | Use runme on server |
| > exp | n | number | epoch_sec | Robot expiration |

Example:

```json
{
	"type":"adm_robot.update",
	"data":
	{
		"r_id":"10",
		"ll":"Robot name"
	},
	"eid":"qwe"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{"type":"*adm_robot.update*","data":{},"r":"p","eid":"q0","ts":1689672324736098034}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.update",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Написать на почту “ответственным” пользователям робота [роль: admin]

Написать сообщение на почту старшего трейдера и на почты "ответственных" за данного робота трейдеров

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.mail_to | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > subj | y | string |  | Message subject, `${ROBOT_ID}` will be replaced with current robot's ID |
| > msg | y | string |  | Message text, `${ROBOT_ID}` will be replaced with current robot's ID |
| > html | n | boolean |  | Send message as HTML, default value is false |

Example:

```json
{
	"type": "adm_robot.mail_to",
	"data": {"r_id":"1", "subj":"Test ${ROBOT_ID}", "msg":"Test ${ROBOT_ID}"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.mail_to | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > emails | y | array |  |  |
| >> [] | y | array |  | List of emails message was sent to |

Example:

```json
{
	"type":"adm_robot.mail_to",
	"data":{"emails":["test@gmail"]},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.mail_to | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.mail_to",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details> 

### Удалить робота [роль: admin]

Удалить робота

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.del_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "adm_robot.del_robot",
	"data": {"r_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.del_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |

Example:

```json
{
	"type":"adm_robot.del_robot",
	"data":{},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.del_robot | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.del_robot",
	"data":
	{
		"msg":"Internal error: Error deleting robot 1",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Подписка на сервера [роль: admin]

Подписаться на события по всем серверам

В любой момент может быть выслан снапшот

В обновлениях всегда приходят все данные по серверу, ключ — id

При удалении сервера придет поле __action=del

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |

Example:

```json
{
	"type": "adm_servers.subscribe",
	"data": {},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > srvs | y | object |  | Servers |
| >> id | y | string |  | Server ID |
| >> host | y | string |  | Server ip-address |
| >> env | y | string |  | Server environment name |
| >> cpus | y | number |  | CPU cores count |
| >> ips | y | array |  | Array of ip-addresses as strings |
| >> blds | y | object |  | Builds available on server |
| >>> BLD_ID | y | string:string |  | Build ID as a key and version + version date/time as value (see example) |
| >> rbts | y | object |  | Robots available on server |
| >>> ROBOT_ID | y | string:object |  | Robot ID |
| >>>> ps | y | number | process_status | Robot system process status |
| >>>> cpus | y | object |  | Cpus used by robot |
| >>>>> cpu | y | number |  | Main thread cpu affinity |
| >>>>> ecpus | y | array |  | Array of other cpus, used by robot |
| >>>    ips | y | array |  | Array of ips, available for robot |
| >> k | y | string |  | Kernel |
| >> st | y | number | stream_status | Server connection status |
| >> a_rbts | y | number |  | Active robots |
| >> f_cpus | y | number |  | Free cpus |

Example:

```json
{
	"type": "servers.subscribe",
	"data": {
		"srvs": {
			"local": {
				"id": "local",
				"host": "127.0.0.1",
				"env": "alma9arm",
				"ips": [
					"172.31.22.254"
				],
				"cpus": 4,
				"blds": {
					"vikingrobot.alma9arm.vrb_test": "5abe45e:1679384076"
				},
				"rbts": {
					"3": {
						"ps": 2,
						"cpus": {
							"cpu": 2,
							"ecpus": [
								0
							]
						}
					},
					"1": {
						"ps": 2,
						"cpus": {
							"cpu": 2,
							"ecpus": [
								0
							]
						}
					},
					"2": {
						"ps": 2,
						"cpus": {
							"cpu": 2,
							"ecpus": [
								0
							]
						}
					}
				},
				"k": "5.14.0-70.13.1.el9_0.aarch64",
				"st": 2,
				"a_rbts": 3,
				"f_cpus": 2
			}
		}
	},
	"r": "s",
	"eid": "q0",
	"ts": 1679400597474532722
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > srvs | y | object |  | Servers |
| >> id | y | string |  | Server ID |
| >> host | y | string |  | Server ip-address |
| >> env | y | string |  | Server environment name |
| >> cpus | y | number |  | CPU cores count |
| >> ips | y | array |  | Array of ip-addresses as strings |
| >> blds | y | object |  | Builds available on server |
| >>> BLD_ID | y | string:string |  | Build ID as a key and version + version date/time as value (see example) |
| >> rbts | y | object |  | Robots available on server |
| >>> ROBOT_ID | y | string:object |  | Robot ID |
| >>>> ps | y | number | process_status | Robot system process status |
| >>>> cpus | y | object |  | Cpus used by robot |
| >>>>> cpu | y | number |  | Main thread cpu affinity |
| >>>>> ecpus | y | array |  | Array of other cpus, used by robot |
| >>>>> ips | y | array |  | Array of ips, available for robot |

Example:

```json
{
    "type": "adm_servers.subscribe",
    "data": {
        "srvs": {
            "local": {
                "id": "local",
                "host": "127.0.0.1",
                "env": "alma9arm",
                "ips": [
                    "172.31.22.254"
                ],
                "cpus": 4,
                "blds": {
                    "vikingrobot.alma9arm.vrb_test": "5abe45e:1679384076"
                },
                "rbts": {
                    "3": {
                        "ps": 2,
                        "cpus": {
                            "cpu": 2,
                            "ecpus": [
                                0
                            ]
                        }
                    },
                    "1": {
                        "ps": 2,
                        "cpus": {
                            "cpu": 2,
                            "ecpus": [
                                0
                            ]
                        }
                    },
                    "2": {
                        "ps": 2,
                        "cpus": {
                            "cpu": 2,
                            "ecpus": [
                                0
                            ]
                        }
                    }
                },
                "k": "5.14.0-70.13.1.el9_0.aarch64",
                "st": 2,
                "a_rbts": 3,
                "f_cpus": 2
            }
        }
    },
    "r": "u",
    "eid": "q0",
    "ts": 1679400597474532722
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_servers.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от серверов [роль: admin]

Отписаться от событий по всем серверам

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"adm_servers.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"adm_servers.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_servers.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Подписка на состояние модулей [роль: admin]

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_state.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |

Example:

```json
{
	"type": "adm_state.subscribe",
	"data": {},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_state.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > ws_admin | y | number | stream_status | Admin WebSocket state |

Example:

```json
{
    "type": "adm_state.subscribe",
    "data": {
        "ws_admin": 1
    },
    "r": "s",
    "eid": "q0",
    "ts": 1688470828209634161
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_servers.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > ws_admin | n | number | stream_status | Admin WebSocket state |

Example:

```json
{
    "type": "adm_state.subscribe",
    "data": {
        "ws_admin": 2
    },
    "r": "u",
    "eid": "q0",
    "ts": 1688470828209634161
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_state.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_state.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от состояния модулей [роль: admin]

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_state.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"adm_state.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_state.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"adm_state.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_state.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_state.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Получить список компаний [роль: admin]

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_state.get_companies | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"adm_state.get_companies",
	"data":
	{},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_state.get_companies | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > companies | y | array |  | Array of companies |
| >> [] | y |  |  |  |
| >>> c_id | y | string |  | Company unique ID |
| >>> name | y | string |  | Company name |

Example:

```json
{
    "type": "adm_state.get_companies",
    "data": {
        "companies": [
            {
                "c_id": "0",
                "name": "public"
            },
            {
                "c_id": "1",
                "name": "viking"
            }
        ]
    },
    "r": "p",
    "eid": "q0",
    "ts": 1688475345022758746
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_state.get_companies | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_state.get_companies",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Получить свободный id робота [роль: admin]

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.next_r_id | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |

Example:

```json
{
	"type":"adm_robot.next_r_id",
	"data":
	{},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.next_r_id | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > r_id | y | string |  | Robot id |

Example:

```json
{
    "type": "adm_robot.next_r_id",
    "data": {
        "r_id": "4"
    },
    "r": "p",
    "eid": "q0",
    "ts": 1688546633242201651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.next_r_id | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.next_r_id",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

## Нескрываемые сообщения

### Подписка на сообщения

Подписаться на сообщения, при успешной подписке приходит снапшот из 20-ти сообщений

В обновлениях приходят только ключ сообщения и обновленный статус

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |

Example:

```json
{
	"type": "messages.subscribe",
	"data": {},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > values | y | object |  | Unread messages snapshot |
| >> [] | y | array |  | List of messages |
| >>> eid | y | string | string_36 | Message unique ID |
| >>> st | y | number |  | Message state (0 - unread, 1 - read) |
| >>> dt | y | number | epoch_msec | Message time |
| >>> msg | y | string |  | Message text |
| > mt | y | number | epoch_msec | Max time, written in data base (can be null) |
| > count | y | number |  | Number of messages with st=1 in data base|

Example:

```json
{
	"type": "messages.subscribe",
	"data": {
	"values": [
		{
			"eid": "e7114511-bed2-425b-b602-29d6d723a5e1",
			"st": 0,
			"dt": 1722258395158,
			"msg": "Test msg 1"
		},
		{
			"eid": "f67349a5-ccc9-4f74-82ff-fd197cd950e3",
			"st": 0,
			"dt": 1722258376516,
			"msg": "Test msg 2"
		}
	],
	"mt": 1721984718924,
	"count": 2
	},
	"ts":1657693572940145200,
  	"eid":"qwerty",
  	"r":"s"
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > values | y | object |  | Unread messages snapshot |
| >> [] | y | array |  | List of messages |
| >>> eid | y | string | string_36 | Message unique ID |
| >>> st | y | number |  | Message state (0 - unread, 1 - read) |

Example:

```json
{
  "type": "messages.subscribe",
  "data": {
    "values": [
      {
        "eid": "e7114511-bed2-425b-b602-29d6d723a5e1",
        "st": 1
      }
    ]
  },
  "ts":1657693572940145200,
  "eid":"qwerty",
  "r":"u"
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"messages.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>  

### Отписка от сообщений

Отписаться от сообщений

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"messages.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"messages.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"messages.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>

### Запрос истории сообщений

Получить “небольшую” историю старше заданной даты

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > read | n | boolean |  | Show already read messages, default value is false |
| > mt | y | number | epoch_msec | Receive messages “older” than this value |
| > lim | n | number |  | Number of messages to receive in range [1, 100], default value is 100 |

Example:

```json
{
	"type": "messages.get_previous",
	"data": {
		"mt": "2000000000000",
		"lim": 100
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > values | y | object |  | Unread messages snapshot |
| >> [] | y | array |  | List of messages |
| >>> eid | y | string | string_36 | Message unique ID |
| >>> st | y | number |  | Message state (0 - unread, 1 - read) |
| >>> dt | y | number | epoch_msec | Message time |
| >>> msg | y | string |  | Message text |

Example:

```json
{
	"type": "messages.get_previous",
	"data": {
	"values": [
		{
			"eid": "e7114511-bed2-425b-b602-29d6d723a5e1",
			"st": 0,
			"dt": 1722258395158,
			"msg": "Test msg 1"
		},
		{
			"eid": "f67349a5-ccc9-4f74-82ff-fd197cd950e3",
			"st": 0,
			"dt": 1722258376516,
			"msg": "Test msg 2"
		}
	]
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"p"
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.get_previous | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"messages.get_previous",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

### Запрос истории сообщений 2

Получить историю от даты до даты

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > read | n | boolean |  | Show already read messages, default value is false |
| > mint | y | number | epoch_msec | Receive messages “newer” or equal than this value |
| > maxt | y | number | epoch_msec | Receive messages “older” or equal than this value |
| > lim | n | number |  | Number of messages to receive in range [1, 100], default value is 100 |

Example:

```json
{
	"type": "messages.get_history",
	"data": {
		"mt": "2000000000000",
		"lim": 100
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > values | y | object |  | Unread messages snapshot |
| >> [] | y | array |  | List of messages |
| >>> eid | y | string | string_36 | Message unique ID |
| >>> st | y | number |  | Message state (0 - unread, 1 - read) |
| >>> dt | y | number | epoch_msec | Message time |
| >>> msg | y | string |  | Message text |

Example:

```json
{
	"type": "messages.get_history",
	"data": {
	"values": [
		{
			"eid": "e7114511-bed2-425b-b602-29d6d723a5e1",
			"st": 0,
			"dt": 1722258395158,
			"msg": "Test msg 1"
		},
		{
			"eid": "f67349a5-ccc9-4f74-82ff-fd197cd950e3",
			"st": 0,
			"dt": 1722258376516,
			"msg": "Test msg 2"
		}
	]
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"p"
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.get_history | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"messages.get_history",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

### Добавить сообщение [роль: admin]

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.add | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > to | y | string |  | User to send message to |
| > msg | y | string |  | Message text |

Example:

```json
{
	"type": "messages.add",
	"data": {
		"to": "test@gmail.com",
		"msg": "Hello world!"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.add | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > eid | y | string | string_36 | Message unique ID |
| > dt | y | number | epoch_msec | Message time |

Example:

```json
{
	"type": "messages.add",
	"data": {
		"eid": "e7114511-bed2-425b-b602-29d6d723a5e1",
		"dt": 1722258395158
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"p"
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.add | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"messages.add",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

### Отметить сообщение как прочитанное

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.mark_as_read | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > eid | y | string | string_36 | Message unique ID |

Example:

```json
{
	"type": "messages.mark_as_read",
	"data": {
		"eid": "e7114511-bed2-425b-b602-29d6d723a5e1"
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.mark_as_read | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > eid | y | string | string_36 | Message unique ID |
| > st | y | number |  | Message state (0 - unread, 1 - read) |

Example:

```json
{
	"type": "messages.mark_as_read",
	"data": {
		"eid": "e7114511-bed2-425b-b602-29d6d723a5e1",
		"st": 1
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"p"
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = messages.mark_as_read | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"messages.mark_as_read",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

## Компании и пользователи

### Подписка на компании [роль: admin]

В любой момент может быть выслан снапшот

В обновлениях приходят только измененные данные по компании, ключ — c_id

При удалении компании придет поле __action=del

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |

Example:

```json
{
	"type": "adm_companies.subscribe",
	"data":	{},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > comps | y | array |  |  |
| >> [] | y | array |  | Array of companies |
| >>> c_id | y | string |  | Company id |
| >>> name | y | string |  | Name |

Example:

```json
{
  "type": "adm_companies.subscribe",
  "data": {
    "comps": [
      { "c_id": "0", "name": "public" },
      { "c_id": "1", "name": "viking" },
      { "c_id": "1001", "name": "test" },
      { "c_id": "1004", "name": "test1" },
      { "c_id": "1005", "name": "test2" },
      { "c_id": "1002", "name": "_1000" },
      { "c_id": "1003", "name": "_1000" }
    ]
  },
  "r": "s",
  "eid": "q0",
  "ts": 1693393274699469298
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = companies.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > comps | y | array |  |  |
| >> [] | y | array |  | Array of companies |
| >>> c_id | y | string |  | Company id |
| >>> name | n | string |  | Name |
| >>> __action=del | n |  |  |  |

Example:

```json
{
    "type": "adm_companies.subscribe",
    "data": {
        "comps": [
            {
                "c_id": "1004",
                "__action": "del"
            }
        ]
    },
    "r": "u",
    "eid": "q0",
    "ts": 1693393274719343188
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_companies.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от компаний [роль: admin]

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = companies.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"companies.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = companies.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"companies.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = companies.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"companies.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Создать компанию [роль: admin]

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.add | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > name | y | string |  | Name |

Example:

```json
{
	"type": "adm_companies.add",
	"data": {"name":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.add | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > c_id | y | string |  | Company ID |

Example:

```json
{
	"type":"adm_companies.add",
	"data":{"c_id":"1"},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.add | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_companies.add",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    


### Изменить компанию [роль: admin]

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > c_id | y | string |  | Company ID |
| > name | n | string |  | Name |

Example:

```json
{
	"type": "adm_companies.update",
	"data": {"name":"1", "c_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > c_id | y | string |  | Company ID |

Example:

```json
{
	"type":"adm_companies.update",
	"data":{"c_id":"1"},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_companies.update",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Удалить компанию [роль: admin]

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.remove | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > c_id | y | string |  | Company ID |

Example:

```json
{
	"type": "adm_companies.remove",
	"data": {"c_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.remove | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > c_id | y | string |  | Company ID |

Example:

```json
{
	"type":"adm_companies.remove",
	"data":{"c_id":"1"},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_companies.remove | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_companies.remove",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    


### Получить/подписка список пользователей в компаниях

Ключ — c_id + u_id

Подписка доступна только админу

По подписке всегда ходит снапшот

Подписка subscribe вместо get

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |

Example:

```json
{
	"type": "users_in_companies.get",
	"data":	{},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > usrs | y | array |  |  |
| >> [] | y | array |  | Array of users in companies |
| >>> c_id | y | string |  | Company id |
| >>> comp | y | string |  | Company name |
| >>> u_id | y | string |  | User ID (email) |
| >>> roles | y | array |  | Array of roles as strings |
| >>> rbts | y | array |  | Array of robot ids as strings |
| >>> portfs | y | array |  | Array users’s portfolios |
| >>>> [] | y | [string, string] | portfolio_id | Portfolio ID (robot ID and portfolio name) |

Example:

```json
{
  "type": "users_in_companies.get",
  "data": {
    "usrs": [
      {
        "roles": ["admin"],
        "rbts": [],
        "portfs": [],
        "c_id": "1002",
        "comp": "_1000",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin", "head_of_traders", "trader"],
        "rbts": [],
        "portfs": [],
        "c_id": "1",
        "comp": "viking",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin"],
        "rbts": [],
        "portfs": [],
        "c_id": "1003",
        "comp": "_1000",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin"],
        "rbts": [],
        "portfs": [],
        "c_id": "1005",
        "comp": "test2",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin"],
        "rbts": [],
        "portfs": [],
        "c_id": "1001",
        "comp": "test",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin", "demo"],
        "rbts": ["1"],
        "portfs": [["1", "qwe"]],
        "c_id": "0",
        "comp": "public",
        "u_id": "test@gmail.com"
      }
    ]
  },
  "r": "s",
  "eid": "q0",
  "ts": 1693481809219464007
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"users_in_companies.get",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Добавить/изменить/удалить пользователя в компании

Одна команда для добавления/изменения/удаления

Для удаления нужно оставить список ролей пустым

Для данного пользователя будут закрыты все его вебсокет сессии!

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > c_id | y | string |  | Company id |
| > u_id | y | string |  | User ID (email) |
| > add | n | boolean |  | Use this flag on adding new user to company, default value is false. If flag is set, you will receive an error message if user is already in company |
| > roles | y | array |  | Array of roles as strings |
| > rbts | y | array |  | Array of robot ids as strings |
| > portfs | y | array |  | Array users’s portfolios |
| >> [] | y | [string, string] | portfolio_id | Portfolio ID (robot ID and portfolio name) |

Example:

```json
{
	"type": "users_in_companies.update",
	"data":
	{
		"u_id": "test@gmail.com",
		"c_id": "0",
		"roles": ["admin", "trader"],
		"rbts": ["1"],
		"portfs":[["1", "test1"]]
	},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > usrs | y | array |  |  |
| >> [] | y | array |  | Array of users in companies |
| >>> c_id | y | string |  | Company id |
| >>> comp | y | string |  | Company name |
| >>> u_id | y | string |  | User ID (email) |
| >>> roles | y | array |  | Array of roles as strings |
| >>> rbts | y | array |  | Array of robot ids as strings |
| >>> portfs | y | array |  | Array users’s portfolios |
| >>>> [] | y | [string, string] | portfolio_id | Portfolio ID (robot ID and portfolio name) |

Example:

```json
{
  "type": "users_in_companies.get",
  "data": {
    "usrs": [
      {
        "roles": ["admin"],
        "rbts": [],
        "portfs": [],
        "c_id": "1002",
        "comp": "_1000",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin", "head_of_traders", "trader"],
        "rbts": [],
        "portfs": [],
        "c_id": "1",
        "comp": "viking",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin"],
        "rbts": [],
        "portfs": [],
        "c_id": "1003",
        "comp": "_1000",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin"],
        "rbts": [],
        "portfs": [],
        "c_id": "1005",
        "comp": "test2",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin"],
        "rbts": [],
        "portfs": [],
        "c_id": "1001",
        "comp": "test",
        "u_id": "test@gmail.com"
      },
      {
        "roles": ["admin", "demo"],
        "rbts": ["1"],
        "portfs": [["1", "qwe"]],
        "c_id": "0",
        "comp": "public",
        "u_id": "test@gmail.com"
      }
    ]
  },
  "r": "s",
  "eid": "q0",
  "ts": 1693481809219464007
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"users_in_companies.update",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Получить компании доступные пользователю

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_companies | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |

Example:

```json
{
	"type": "users_in_companies.get_companies",
	"data": {},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_companies | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > comps | array |  |  |  |
| >> [] | array |  |  | Companies |
| >>> c_id | y | string |  | Company ID |
| >>> name | y | string |  | Company name |

Example:

```json
{
  "type": "users_in_companies.get_companies",
  "data": {
    "comps": [
      { "c_id": "1002", "name": "_1000" },
      { "c_id": "1", "name": "viking" },
      { "c_id": "1003", "name": "_1000" },
      { "c_id": "1005", "name": "test2" },
      { "c_id": "1001", "name": "test" },
      { "c_id": "0", "name": "public" }
    ]
  },
  "r": "p",
  "eid": "q0",
  "ts": 1693481809217639511
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_companies | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"users_in_companies.get_companies",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Получить роботов компании

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_robots | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > c_id | y | string |  | Company ID |

Example:

```json
{
	"type": "users_in_companies.get_robots",
	"data": {"c_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_robots | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > rbts | array |  |  | Array of robots as strings |

Example:

```json
{
  "type": "users_in_companies.get_robots",
  "data": { "rbts": ["1", "2", "3"] },
  "r": "p",
  "eid": "q0",
  "ts": 1693481809218424440
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_robots | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"users_in_companies.get_robots",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Получить портфели компании

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_portfolios | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > c_id | y | string |  | Company ID |

Example:

```json
{
	"type": "users_in_companies.get_portfolios",
	"data": {"c_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_portfolios | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > portfs | y | array |  | Array of users’s portfolios |
| >> [] | y | [string, string] | portfolio_id | Portfolio ID (robot ID and portfolio name) |

Example:

```json
{
  "type": "users_in_companies.get_portfolios",
  "data": {
    "portfs": [
      ["1", "replace"],
      ["1", "test96"],
      ["1", "test97"],
      ["1", "test98"],
      ["1", "test99"],
      ["3", "test"]
    ]
  },
  "r": "p",
  "eid": "q0",
  "ts": 1693481809218962771
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_portfolios | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"users_in_companies.get_porfolios",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Получить портфели пользователя в компании

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_user_portfolios | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > c_id | y | string |  | Company ID |

Example:

```json
{
	"type": "users_in_companies.get_user_portfolios",
	"data": {"c_id":"1", "u_id":"test@gmail.com"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_user_portfolios | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > portfs | y | array |  | Array of users’s portfolios |
| >> [] | y | [string, string] | portfolio_id | Portfolio ID (robot ID and portfolio name) |

Example:

```json
{
  "type": "users_in_companies.get_user_portfolios",
  "data": {
    "portfs": [
      ["1", "replace"],
      ["1", "test96"],
      ["1", "test97"],
      ["1", "test98"],
      ["1", "test99"],
      ["3", "test"]
    ]
  },
  "r": "p",
  "eid": "q0",
  "ts": 1693481809218962771
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_user_portfolios | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"users_in_companies.get_user_porfolios",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

### Получить емейлы пользователей компании

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_users | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > c_id | y | string |  | Company ID |

Example:

```json
{
	"type": "users_in_companies.get_users",
	"data": {"c_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_robots | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > usrs | array |  |  | Array of emails as strings |

Example:

```json
{
  "type": "users_in_companies.get_userss",
  "data": { "usrs": ["test@gmail.com", "xxx@mail.ru"] },
  "r": "p",
  "eid": "q0",
  "ts": 1693481809218424440
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = users_in_companies.get_users | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"users_in_companies.get_users",
	"data":
	{
		"msg":"Internal error",
		"code":18
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

### Подписка на параметры пользователя

В любой момент может быть выслан снапшот

В обновлениях приходят только измененные данные по пользователю, ключ — u_id

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > u_id | y | string |  | User ID (email) |

Example:

```json
{
	"type": "user.subscribe",
	"data":	{"u_id":"test@mail.ru"},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > u_id | y | string |  | User ID (email) |
| > api_key | y | string |  | API key |
| > enable_api | y | boolean |  | Enable API flag |
| > tgr | y | number |  | Telegram ID |

Example:

```json
{
  "type": "user.subscribe",
  "data": { "tgr": 214020169, "enable_api": true, "api_key": "******" },
  "r": "s",
  "eid": "q0",
  "ts": 1694072105955648388
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > u_id | y | string |  | User ID (email) |
| > api_key | n | string |  | API key |
| > enable_api | n | boolean |  | Enable API flag |
| > tgr | n | number |  | Telegram ID |

Example:

```json
{
  "type": "user.subscribe",
  "data": { "enable_api": false, "api_key": "", "u_id": "test@gmail.com" },
  "r": "u",
  "eid": "q0",
  "ts": 1694072105972483566
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"user.subscribe",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от параметров пользователя

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"user.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"user.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"user.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>    

### Изменить параметры пользователя

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > u_id | y | string |  | User ID (email) |
| > api_key | n | string |  | API key |
| > enable_api | n | boolean |  | Enable API flag |
| > tgr | n | number |  | Telegram ID |

Example:

```json
{
	"type": "user.update",
	"data":	{"u_id":"test@mail.ru", "tgr":1},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > u_id | y | string |  | User ID (email) |
| > api_key | n | string |  | API key |
| > enable_api | n | boolean |  | Enable API flag |
| > tgr | n | number |  | Telegram ID |

Example:

```json
{
    "type": "user.update",
    "data": {
        "enable_api": true,
        "api_key": "QnRxE9QHyd1Hymd1i5nemcD45m2mWf8zUCpdl24HKLFuKSW6rQvOAukWTKqS2ELDzmWegBniEUVUoJJD",
        "u_id": "test@gmail.com"
    },
    "r": "p",
    "eid": "q0",
    "ts": 1694072105972483566
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.update | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"user.update",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

### Получить отключенные настройки telegram уведомлений пользователя

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.get_tgr_notifications | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |

Example:

```json
{
	"type": "user.get_tgr_notifications",
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.get_tgr_notifications | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > values | y | object |  |  |
| >> ROBOT_ID:VALUE | y | string:number | string:tgr_notification | Robot ID and bitmask of turned off telegram noitification levels |

Example:

```json
{
    "type": "user.get_tgr_notifications",
    "data": {
        "values": {
            "1": 7,
            "2": 1
        }
    },
    "r": "p",
    "eid": "q0",
    "ts": 1694072105972483566
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.get_tgr_notifications | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"user.get_tgr_notifications",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

### Отключить настройки telegram уведомлений пользователя

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.set_tgr_notifications | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > values | y | object |  |  |
| >> ROBOT_ID:VALUE | y | string:number | string:tgr_notification | Robot ID and bitmask of turned off telegram noitification levels |


Example:

```json
{
    "type": "user.set_tgr_notifications",
    "eid": "qwerty"
    "data": {
        "values": {
            "1": 7,
            "2": 1
        }
    },
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.set_tgr_notifications | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
    "type": "user.set_tgr_notifications",
    "r": "p",
    "eid": "q0",
    "ts": 1694072105972483566
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = user.set_tgr_notifications | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"user.set_tgr_notifications",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details> 


## Операции админа

### Множественные операции над портфелями/подключениями робота (для админа)

*stop_trading* — выключить торговлю по всем портфелям

*start_trading* — включить торговлю по всем портфелям

*reset_poses* — “сбросить” позиции всех портфеле в ноль

*reset_orders* — “сбросить” статусы заявок всех портфелей

*to_market* — “сбросить” активные заявки всех портфелей “в рынок”

*reconnect_trans* — переподключить все транзакционные подключения

*reconnect_data* — переподключить все маркет-дата подключения

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.OPERATION | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |

Example:

```json
{
	"type": "adm_robot.stop_trading",
	"data": {"r_id":"1"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.OPERATION | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |

Example:

```json
{
	"type":"adm_robot.stop_trading",
	"data":{},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.OPERATION | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.stop_trading",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Операции над портфелями/подключениями робота в базе данных (для админа)

*del_portfolio_db* — удалить портфель сразу из базы данных на отключенном роботе 

*del_trans_conn_db* — удалить транзакционное подключение сразу из базы данных на отключенном роботе 

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.OPERATION | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > r_id | y | string |  | Robot ID |
| > p_id | n | string |  | Portfolio name |
| > sec_type | n | number | sec_type | Trans conn SecType |
| > name | n | string |  | Trans conn name |

Example:

```json
{
    "type": "adm_robot.del_portfolio_db",
    "data": {
        "r_id": "1",
        "p_id": "test41"
    },
    "eid": "1"
}
```
    
```json
{
    "type": "adm_robot.del_trans_conn_db",
    "data": {
        "r_id": "1",
        "sec_type": 1048576,
        "name": "roma"
    },
    "eid": "1"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.OPERATION | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |

Example:

```json
{
	"type":"adm_robot.del_trans_conn_db",
	"data":{},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = adm_robot.OPERATION | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"adm_robot.del_portfolio_db",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

### Подписка на неотправленные email-ы

При обновлении сатуса отправки email-а, всегда приходят все данные по email-у

Когда письмо отправится, придет поле __action=del

<details>
<summary>Subscription request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = emails.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | n | object |  |  |

Example:

```json
{
	"type": "emails.subscribe",
	"data": {},
	"eid": "qwerty"
}
```
</details>    
<details>

<summary>Response on success (snapshot)</summary> 

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = emails.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = s | y | string | request_result | Request result |
| data | y | object |  |  |
| > emails | y | array |  | Array of not sent emails |
| >> [] | y |  |  | Array of objects |
| >>> id | y | number |  | Unique email ID |
| >>> status | y | number | email_status | Email sending status |
| >>> dt | y | string | epoch_nsec | Moment email was added to sending queue |
| >>> subj | y | string |  | Email subject |
| >>> msg | y | string |  | Email text |
| >>> to | y | array |  | Array of emails message was sent to |

Example:

```json
{
	"type":"emails.subscribe",
	"data":
	{
		"emails":[{"id":23,"status":0,"dt":"1705921207989767057","subj":"Test 2","msg":"Test 2", "to":["test@mail.ru"]}]
	},
	"r":"s",
	"eid":"qwerty",
	"ts":1669793958010491759
}
```
</details>    
<details>
<summary>Updates</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = emails.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = u | y | string | request_result | Request result |
| data | y | object |  |  |
| > emails | y | array |  | Array of not sent emails |
| >> [] | y |  |  | Array of objects |
| >>> id | y | number |  | Unique email ID |
| >>> status | n | number | email_status | Email sending status |
| >>> dt | n | string | epoch_nsec | Moment email was added to sending queue |
| >>> subj | n | string |  | Email subject |
| >>> msg | n | string |  | Email text |
| >>> to | n | array |  | Array of emails message was sent to |
| >>> __action = del | n | string |  | Only on delete |

Example:

```json
{
	"type":"emails.subscribe",
	"data":
	{
		"emails":[{"id":23,"status":1,"dt":"1705921207989767057","subj":"Test 2","msg":"Test 2", "to":["test@mail.ru"]}]
	},
	"r":"u",
	"eid":"qwerty",
	"ts":1669793958010491759
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = emails.subscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"emails.subscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>    

### Отписка от неотправленных email-ов

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = emails.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > sub_eid | y | string | string_36 | Subscription eid |

Example:

```json
{
	"type":"emails.unsubscribe",
	"data":
	{
		"sub_eid":"qwerty"
	},
	"eid":"q"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = emails.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |

Example:

```json
{
	"type":"emails.unsubscribe",
	"data":{},
	"r":"p",
	"eid":"q",
	"ts":1669810178671387651
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = emails.unsubscribe | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"emails.unsubscribe",
	"data":
	{
		"msg":"Operation timeout",
		"code":666
	},
	"ts":1657693572940145200,
	"eid":"q",
	"r":"e"
}
```
</details>

### Получить одноразовый ключ для логина от имени другого пользователя (для админа)

Полученный ключ действителен в течение 5 секунд

После успешного или не успешного логина, а также при очередном запросе, текущий одноразовый ключ будет удален

<details>
<summary>Request</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = admins.get_user_one_off_key | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| data | y | object |  |  |
| > u_id | y | string |  | User ID (email) |

Example:

```json
{
	"type": "admins.get_user_one_off_key",
	"data": {"u_id":"test@gmail.com"},
	"eid": "qwerty"
}
```
</details>    
<details>
<summary>Response on success</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = admins.get_user_one_off_key | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = p | y | string | request_result | Request result |
| data | y | object |  |  |
| > one_off_key | y | string |  | One-off auth key |

Example:

```json
{
	"type":"admins.get_user_one_off_key",
	"data":{"one_off_key":"XOQwKibHVevpLwvkgA02ZqpuNFzLUNhe8o3MMYWaYmv2ML4kaWLCTEM025K4QdOW3915lRWSIwvzV2JR"},
	"r":"p",
	"eid":"qwerty",
	"ts":1669798613250710705
}
```
</details>    
<details>
<summary>Response on error</summary>

Payload:

| Key[=value] | Required | JSON type | Internal type | Description |
| --- | --- | --- | --- | --- |
| type = admins.get_user_one_off_key | y | string |  | Operation type |
| eid | y | string | string_36 | External user id that will be received in response |
| ts | y | number | epoch_nsec | Response time in nano seconds |
| r = e | y | string | request_result | Request result |
| data | y | object |  |  |
| > msg | y | string |  | Error message |
| > code | y | number | err_code | Error code |

Example:

```json
{
	"type":"admins.get_user_one_off_key",
	"data":
	{
		"msg":"Permission denied",
		"code":555
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```
</details>

## Типы данных

| Name | JSON type | Description |
| --- | --- | --- |
| string_36 | string | String with maximum length of 36 symbols |
| user_role | string | Enum: “demo” — demo user |
| epoch_nsec | string | Epoch time in nanoseconds integer representation. Example: 1584629107000000000 |
| epoch_msec | number | Epoch time in milliseconds integer representation. Example: 1584629107000 |
| epoch_sec | number | Epoch time in seconds integer representation. Example: 1584629107 |
| request_result | string | Enum: “p” — performed, “e” — error, “s” — snapshot, “u” — update |
| language | string | Enum: “en” — English, “ru” — Russian |
| portfolio_id | [string, string] | Pair of strings, first element is a robot ID, second element is a portfolio name |
| sec_type | number | Integer value, security exchange/connection type. Value should be received in template |
| stream_status | number | Integer value, enum: 0 — disconnected, 1 — connecting, 2 — connected, 3 — unknown |
| trading_status | number | Integer value, enum: 0 — not trading, 2 —trading, 3 — unknown |
| process_status | number | Integer value, enum: 0 — not running, 2 —running, 3 — unknown |
| email_status | number | Integer value, enum: 0 — pending, 1 — in progress, 2 — sent, 3 — send failed |
| direction | number | Integer value, enum: 1 — buy, 2 — sell |
| order_status | number | Integer value, enum: 1 — adding, 2 — running, 4 — deleting, 5 — first_deleting, 6 — sl_deleting, 7 — moving, 99 — add_error |
| symbol_find_state | number | Integer value, enum: 0 — unknown, 1 — searching, 2 — found, 3 — expired, 4 — error |
| tgr_notification | number | 1 — TGR_ORDER (ошибки выставления заявки с выключением торговли),<br> 2 — TGR_ERROR (это ошибки из логирования в формулах), <br> 4 — TGR_NOTIFICATION (уведомления из алгоритма) |
| log_level | number | 0 — LEVEL_DEBUG, зеленый (обычно, запись пользовательских редактирований робота) <br> 1 — LEVEL_INFO, синий <br> 2 — LEVEL_WARNING, желтый <br> 3 — LEVEL_ERROR, красный (это ошибка выставления/снятия заявки, всегда пишется из алгоритма) <br> 4 — LEVEL_CRITICAL, красный (в робота пришли "кривые" JSON данные или операция недоступна или закончился ключ) <br> 5 — LEVEL_ORDER, красный (это ошибка выставления заявки с выключением торговли, ходит в телеграм) <br> 7 — LEVEL_NOTIFICATION, салатовый (уведомления из алгоритма, ходит в телеграм) <br> 10 — LEVEL_SHOW_OK, зеленый (всегда всплывает сообщение) <br> 11 — LEVEL_SHOW_ERR, красный (всегда всплывает сообщение) <br> 12 — LEVEL_SHOW_WARN, желтый (всегда всплывает сообщение) |
| err_code | number | Integer value, enum: <br> 1 — Already authorized, <br> 2 — Authorization error or email not verified, <br> 3 — Not authorized, <br> 4 — Wrong message parameters, <br> 5 — There is no "{role}" in user roles, <br> 6 — Unexpected message type or bad message format, <br> 7 — Duplicate subscription eid, <br> 8 — User not found, <br> 9 — Robot "{r_id}" was not found, <br> 10 — Portfolio "{p_id}" was not found in robot "{r_id}", <br> 11 — Can not connect to robot "{r_id}", <br> 12 — Can not add portfolio, "{p_id}" already exists in robot "{r_id}", <br> 13 — Can not perform operation on disabled portfolio "{p_id}”, <br> 14 — Quantity should be positive, <br> 15 — Wrong command, <br> 16 — Not provided, <br> 17 — Service is overloaded, <br> 18 — Internal error, <br> 19 — Can not restart robot while it is disconnected or if it is trading <br> 20 — Robot "{r_id}" is not exist, <br> 21 — Wrong connection parameters, <br> 22 — Robot "{r_id}" already exists, <br> 23 — Robot "{r_id}" is locked, try again later, <br> 24 — Company "{c_id}" was not found, <br> 25 — Can not delete non empty company "{c_id}”, <br> 26 — Can not perform operation on connected robot "{r_id}”, <br> 555 — Permission denied, <br> 666 — Operation timeout, <br> 777 — Other error from robot |
