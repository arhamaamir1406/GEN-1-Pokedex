# Overview
![project](https://github.com/user-attachments/assets/5c1694f3-9861-433e-8ecf-5867b3b5cbdc)
![arduino](https://github.com/user-attachments/assets/c2b8f43b-ee6b-4fde-84bf-b6fa9f607162)


This project recreates the classic Generation 1 Pokédex using both a web interface and a physical Arduino controller.

The website renders a fully interactive retro Pokédex UI containing all 151 Gen-1 Pokémon, including sprites, descriptions, stats, and cries. Pokémon data is sourced from PokéAPI and transformed into a lightweight local dataset used by the UI.

An Arduino Uno with joystick, buttons, LEDs, buzzer, and LCD acts as a physical Pokédex controller, allowing real-world navigation and feedback synchronized with the site via the browser’s Web Serial API.

The result is a hybrid digital-physical Pokédex:
navigate Pokémon on the website → see them on the Arduino LCD → hear cries and watch LEDs respond.

# Website
The web Pokédex replicates the classic Game Boy Pokédex layout and behavior.

## Data Source

Pokémon data is fetched from PokéAPI and compiled into a Gen-1 dataset containing:

ID

Name

Types

Description (flavor text)

Height / weight

Sprite

Cry audio

The site loads this dataset and renders Pokémon dynamically, so a single UI design works for all 151 Pokémon.

## Features

Full Gen-1 Pokémon database

Retro Pokédex UI

Sprite + description display

Height / weight conversion

Scrollable Pokémon list

Keyboard navigation

Pokémon cries

Arduino serial integration (Web Serial API)

## Controls

D-pad / arrow keys → previous / next Pokémon

RND → random Pokémon

CRY → play Pokémon cry

Connect Arduino → sync hardware controller

The website sends Pokémon updates to Arduino so the LCD always shows the currently selected Pokémon

# Hardware (Pokedex Controller)
The physical controller mirrors the Pokédex navigation and feedback.

## Parts

Arduino Uno R3

LCD1602 (16×2 character display)

Analog joystick module

2 push buttons

Red LED

Blue LED

Piezo buzzer

Breadboard

Jumper wires

Resistors

A full wiring schematic will be added soon (if I feel like it).

## Hardware Behavior

Joystick → previous / next Pokémon

Button 1 → play cry

Button 2 → random Pokémon

LCD → Pokémon number + name

Red LED → previous

Blue LED → next

Both LEDs + buzzer → cry feedback

# How to Launch

## Build the Arduino

Assemble the hardware using the listed components.
(Schematic coming soon.)

## Upload the Arduino firmware

Open Arduino IDE

Open the provided .ino file

Select Arduino Uno

Select your COM port

Upload

After upload, the LCD should display:

*POKEDEX READY*

*Connect Site*
## Run the website

The website is included in this repo.

## Connect Arduino to the site

Plug Arduino into USB

Click CONNECT ARDUINO on the website

Select the Arduino COM port

The hardware and website are now synchronized
# Credits

This project would not be possible without:

Pokémon data and descriptions:
https://pokeapi.co/

Pokémon sprites:
https://github.com/PokeAPI/sprites

Pokémon cry audio:
https://github.com/PokeAPI/cries
