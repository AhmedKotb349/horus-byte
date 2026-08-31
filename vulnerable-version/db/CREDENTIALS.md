# Seed Accounts (fake / synthetic data — training use only)

This prototype ships with a large generated dataset so hunting doesn't rely
on just 1-2 records. All passwords are shared per role for convenience.

| Role | Password |
|---|---|
| citizen | Citizen@123 |
| doctor | Doctor@123 |
| admin | Admin@123 |

## Sample accounts to start with

| Name | National ID (login) | Role | Governorate |
|---|---|---|---|
| Khaled Mostafa | 9011007962 | admin | Cairo |
| Nermeen Sabry | 9011019483 | admin | Cairo |
| Ayman Farouk | 9011025608 | admin | Cairo |
| Dr. Ahmed Kotb | 9011033271 | doctor | Cairo |
| Dr. Khaled Kamal | 9011041998 | doctor | Cairo |
| Dr. Yasmin Anwar | 9011051729 | doctor | Cairo |
| Dr. Ahmed Hegazy | 9021068510 | doctor | Alexandria |
| Dr. Hind Hassan | 9021072651 | doctor | Alexandria |
| Dr. Mahmoud Anwar | 9021088785 | doctor | Alexandria |
| Khaled Farouk | 9011196160 | citizen | Cairo |
| Hind Hassan | 9011205663 | citizen | Cairo |
| Ahmed Fathy | 9011215056 | citizen | Cairo |
| Salma Saad | 9011229500 | citizen | Cairo |
| Khaled Fouad | 9011239270 | citizen | Cairo |
| Nourhan Mostafa | 9011242331 | citizen | Cairo |

Full dataset: **78 citizens**, **16 doctors**, **3 admins** across 10 governorates — query `users` table directly for the complete list. All names, IDs, and records are fictional.
