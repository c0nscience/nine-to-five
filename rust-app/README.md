# Nine to Five

This is a simple time tracking app. I build it years ago in different languages mainly to provide the tool for me to track my tasks during the day for work and to know in the end exactly 
how long I worked overall.

As it turns out humans are pretty bad at estimating and gage their time worked. I once talked to a colleague, which I knew worked long hours very often, estimated his overtime to about 20'ish 
hours. I think is actual overtime was way way higher than that.

It is not the most complex application. In the end you have an activity (this is how I call it on the backend) which has a name, a start and end date and some tags associated with it.
The app serves me already for many years, since about September 2017 with 9625 entries made by me alone (checked: 2024-02-14).
This push now is the final public release for everyone to enjoy for free.

## Why did I build it?

I was already in the habbit tracking my working hours. In my first student job I wanted to know how much money I would make with the shifts I got assigned. This is where it started.
As a working student, in the first software company I stared working in 2011, my boss wanted to have a timesheet every so often. So I kept going and really made it a habbit.
It was also comforting to always know my exact worked time and roughly what I worked on. Was good to remember things in stand up after the weekend or just if I wanted to know what did I do 
the past 6 month at work. Before `9to5` existed I used excel, which was ok. Sure the app now is not much more. But it was cluncky. The app I can use on my laptop, desktop and phone.
Everywhere and everytime.

As I grew tired of using excel. I searched first for alternatives (as discribed on my blog)[https://pursuit-of-simplicity.pages.dev/blog/the-pursuit-of-simplicity/] but was not really 
happy with the complexity of the available apps/services and also most of them cost money. Which I thought: no. I am an employee and want to know simply how much I work. I am not paying for 
it. So I set out to build it my self. Well ironically I by now pay for the servers the service runs on, because I quickly was annoyed buy the sleep of heroku's free tier machines.
Working over the years on nine to five I learned a lot: For example that java in any shape or form is really heavy. So as I rewrote the server with `golang` I reduced the memory usage by 
97% and also the latency it like three times or more faster. Basically doing the same thing as before.

Anyhow if you are interested head over to (9to5.app)[https://9to5.app] and try it once it is released to the public.

# Development

## Technology

- rust
- postgres
- htmx
- hyperscript
- tailwindcss

## Running the server

Put all required environment variables in an `.env` file.

Just execute bacon with all the required environment variables and press `r`

```bash
bacon
```

## Generating a secret key for secure cookies

```bash
echo -n "some text" | openssl dgst -mac HMAC -macopt hexkey:369bd7d655 -sha512
```
