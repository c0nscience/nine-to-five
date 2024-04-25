```
// get child sick days
{tags: "child-sickday", start: {$gte: new ISODate('2022-01-01'), $lt: new ISODate('2023-01-01')}}

// sick days
{tags: "call-in-sick", start: {$gte: new ISODate('2022-01-01'), $lt: new ISODate('2023-01-01')}}
{tags: "sickday", start: {$gte: new ISODate('2022-01-01'), $lt: new ISODate('2023-01-01')}}
```