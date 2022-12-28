# 10. API v2



## 10.1. Подписки



### 10.1.1. Подписка на "дерево"

Подписка
```{
       "type": "subscribe",
       "clOrdId": "1",
       "data": {
           "topic": "robots"
       }
   }```
```
{
       "type": "subscribe",
       "clOrdId": "1",
       "data": {
           "topic": "robots",
           "admin": true
       }
   }
```
clOrdId - пользовательский идентификатор сообщения, он же придет во всех ответах
admin - получать данные доступные только для админа

Ответ (снапшот)
```
{
    "type": "callback",
    "data": {
        "robots": {
            "1": {
                "portfolios": {
                    "test": {
                        "re_buy": false,
                        "re_sell": false,
                        "all_free": 1,
                        "disabled": false,
                        "securities": {
                            "BNF_BTCUSDT": {
                                "sec_key": "BNF_BTCUSDT",
                                "sec_type": 34359738368,
                                "client_code": "virtual",
                                "sec_key_subscr": "BTCUSDT"
                            }
                        },
                        "has_virtual": true,
                        "name": "test",
                        "owner": "test@gmail.com"
                    }
                },
                "trans_conns": {
                    "0_virtual": {
                        "sec_pos": null,
                        "coin_pos": null,
                        "disabled": false,
                        "sec_type": 0,
                        "name": "virtual",
                        "full_name": "virtual"
                    }
                },
                "data_conns": {
                    "34359738368_binancefut_listen": {
                        "disabled": false,
                        "sec_type": 34359738368,
                        "name": "binancefut_listen"
                    }
                },
                "start": false,
                "rl": "",
                "rv": "",
                "rvd": 0,
                "mc": 0,
                "de": -1,
                "dt": 0,
                "pms": 1,
                "name": "1",
                "rc": false
            },
            "12": {
                "portfolios": {
                    "test": {
                        "re_buy": false,
                        "re_sell": false,
                        "all_free": 1,
                        "disabled": false,
                        "securities": {
                            "BNF_BTCUSDT": {
                                "sec_key": "BNF_BTCUSDT",
                                "sec_type": 34359738368,
                                "client_code": "virtual",
                                "sec_key_subscr": "BTCUSDT"
                            }
                        },
                        "has_virtual": true,
                        "name": "test",
                        "owner": "test@gmail.com"
                    }
                },
                "trans_conns": {
                    "0_virtual": {
                        "sec_pos": null,
                        "coin_pos": null,
                        "disabled": false,
                        "sec_type": 0,
                        "name": "virtual",
                        "full_name": "virtual"
                    }
                },
                "data_conns": {
                    "34359738368_binancefut_listen": {
                        "disabled": true,
                        "sec_type": 34359738368,
                        "name": "binancefut_listen"
                    }
                },
                "start": true,
                "rl": "",
                "rv": "",
                "rvd": 0,
                "mc": 0,
                "de": -1,
                "dt": 0,
                "pms": 0,
                "name": "12",
                "rc": false
            }
        },
        "snapshot": true
    },
    "ts": 1646903524392865792,
    "clOrdId": "1"
}
```
snapshot - означает снапшот это или обновление
re_sell/re_buy - портфель может покупать/продавать
all_free - нет активных заявок в портфеле
disabled - портфель отключен
has_virtual - торговля с использованием виртуальных подключений
name - имя
owner - создатель/хозяин портфеля
client_code - используемое торговое подключение
start - флаг, означающий должен ли быть в данный момент включен робот
rl - имя робота
rv - версия робота
rvd - дата версии робота
mc - число проходов главного цикла событий в секунду
mtc - лимит транзакционных подключений
de - осталось дней до окончания лицензии (0 - лицензия закончилась, <=0 - не известно)
dt - дата/время на сервере робота
pms - права (FOR_ALL = 0, USER = 1, ADMIN = 10)
rc - робот подключен
wr - робот ожидает перезапуска после смены "критичных" настроек
gc - все подключения робота к биржам подключены (CLOSED = 0, OPENING = 1, ONLINE = 2, UNKNOWN = 3)
tr - торговля включена или есть активные заявки (NOT_TRADING = 0, TRADING = 2, UNKNOWN = 3)
shared - "шареный робот"
ip - доступные адреса
__action - если равно "del", то удалить данный ключ
clear - имя ключа, который нужно удалить из данного словаря (удалять нужно первым делом, т.к. в сообщении содержится новое значение данного ключа)
expiration - дата окончания действия лицензии (только для админа)
robot_comment - комментарий (только для админа)
max_trans_count - лимит транзакционных подключений (только для админа)
log_days - сколько дней хранить логи (только для админа)
cpu - исползуемое ядро процессора (только для админа)
robot_type - имя сборки (только для админа)
for_all - робот доступный всем (только для админа)
cmd_params - параметры запуска (только для админа)
mail_to - отправлить сообщение на почты(только для админа)
users - пользователи робота (только для админа)
Обновления (приходит только id робота, имя портфеля и бумаги или ключ подключения, и то что обновилось)
{"type": "callback", "clOrdId": "1", "data": {"robots":{"1":{"portfolios": {"qwe": {"name": "qwe", "securities": {"CEX_BTC_USD": {"__action": "del"}}}}}}, "snapshot": false},"ts":1624516437000000123}
{"type": "callback", "clOrdId": "1", "data":{"robots":{"1":{"rc":true}}, "snapshot":false}, "ts":1646903528002037248}
формат сообщения такой же, как у снапшота