### 12.1.1. Авторизация пользователя через Firebase

Только для сайта

Request Payload:
| Key[=value]        | Required           | JSON type  | Internal type | Description
| ------------- |:-------------:| -----:|-----:|-----:|
| type = authorization_firebase    | y | string | | Operation type
| eid      | y      |   string | string_36 | External user id that will be received in response
| data      | y      |   object |  | 
| client_id      | y      |   string |  | Firebase client_id
| token      | y      |   string |  | Firebase access token
| role      | n      |   string | user_role | User login role (demo is default)

```javascript
{
	"type": "authorization_firebase",
	"data": {
		"client_id": "81Fk8whhHvabzTchEEnQeJjCPS53",
		"token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImVhNWY2NDYxMjA4Y2ZmMGVlYzgwZDFkYmI1MjgyZTkyMDY0MjAyNWEiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoi0JDQvdGC0L7QvSDQodC-0LvQvtCy0YzRkdCyIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdqYkU4a0ZlSHMxNDdVRDI5QzhKSUN4a3pXci0zSFZlRVVlS1ZJRD1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9ib3QtZmt2aWtpbmciLCJhdWQiOiJib3QtZmt2aWtpbmciLCJhdXRoX3RpbWUiOjE2NTc2OTM1NzIsInVzZXJfaWQiOiI4MUZrOHdoaEh2YWJ6VGNoRUVuUWVKakNQUzUzIiwic3ViIjoiODFGazh3aGhIdmFielRjaEVFblFlSmpDUFM1MyIsImlhdCI6MTY1NzY5MzU3MiwiZXhwIjoxNjU3Njk3MTcyLCJlbWFpbCI6Ijc2NDExMDlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTYxMTY2OTg4Njk0MzI0OTg4ODciXSwiZW1haWwiOlsiNzY0MTEwOUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.CzuPsAeLh49fOaGc14xih9-lk8Y1965FTHpNWk6tOdl9Dj1uBgi1OTUNfEgVJi_8coYK0hlio0o5hfu15LXsCPWJRZ6I3W32i7sBKLotekTv0oDDCN1pq2Jqoyl7Ary2lsKeyW8qXkDiWl1T77jO5P1gEC0kkabW5Yb4CNeNFMAcKNtO-hjckdcD25URcYuQLmfym49G0FfszPDONaBQe1c1NxBNvZrp72sLk-r12LIZgOm795Upl2-hXaH7xNHKQZO885MqAx29IZ6M952la1VTKTlkzyNDijYhcfDs2Izc6XIBm-rj1m_dR0JWDrv4mzWwOJR4_3KjkL6nAi4NnA",
		"role": "demo"
	},
	"eid": "qwerty"
}
```
Response on success
```javascript
{
    "type": "authorization_firebase",
    "data": {
        "lang": "ru",
        "ui_items": {
            "main": {
                "type": "page",
                "url": "/",
                "methods": [],
                "widgets": {
                    "welcome": {
                        "methods": []
                    }
                }
            },
            "portfolio_groups": {
                "type": "page",
                "url": "portfolio-groups",
                "methods": [],
                "widgets": {
                    "portfolio_group_list": {
                        "methods": []
                    }
                }
            },
            "portfolio_group": {
                "type": "detail",
                "url": "portfolio-group/:group_name",
                "widgets": {
                    "portfolio_group_items": {
                        "methods": []
                    },
                    "portfolio_group_analytics": {
                        "methods": []
                    }
                }
            },
            "portfolio": {
                "url": "portfolio/:portfolio-id",
                "type": "detail",
                "widgets": {
                    "portfolio_analytics": {
                        "methods": []
                    },
                    "portfolio_settings": {
                        "methods": []
                    },
                    "portfolio_assets": {
                        "methods": []
                    }
                }
            }
        },
        "active_role": "trader",
        "roles": [
            "trader",
            "admin",
            "boss"
        ]
    },
    "ts": 1657693572940145200,
    "eid": "qwerty",
    "r": "p"
}
```

Response on error

Example
```javascript
{
	"type":"authorization_firebase",
	"data":
	{
		"msg":"Authorization error or email not verified",
		"code":2
	},
	"ts":1657693572940145200,
	"eid":"qwerty",
	"r":"e"
}
```