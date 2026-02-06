# ============================================================================
#                           VSC A11Y Extension
#           (Color Blindness test based on Ishihara testing)
#
#
# ===========================================================================


import math
import random
from PIL import Image, ImageDraw, ImageFont

# ==========================================================================
# KONFIGURACIJA
# ==========================================================================

# Dimenzija slike u pikselima (600x600)
SIZE = 600

# Ukupan broj krugova koji će biti nasumično raspoređeni na slici
TOTAL_CIRCLES = 1000

# Boja pozadine (bijela) u RGB formatu
BACKGROUND = (255,255,255)

# =======================================================================
# PALETE BOJA ZA RAZLIČITE TIPOVE TESTOVA NA DALTONIZAM 
# =======================================================================
# Svaka paleta ima dvije skupine boja:
# - "on": boje za krugove koji se nalaze NA broju (trebaju biti vidljivi)
# - "off": boje za krugove koji su IZVAN broja (služe kao šum/pozadina)
# - palete boja u RGB smo dobili iz ChatGPT izvora  

PALETTES = {

    # Test za crveno-zeleni daltonizam (deuteranopija i protanopija)
    # Najčešći oblik daltonizma - problema s razlikovanjem crvene i zelene
    "red_green": {
        # Narančaste nijanse za broj (vidljive osobama s daltonizmom)
        "on": [(249,187,130),(235,161,112),(252,205,132)],
        # Zelenkaste nijanse za pozadinu (teško razlučive od broja za daltoniste)
        "off":[(156,165,148),(172,180,165),(187,185,100),
               (215,218,170),(229,213,125),(209,214,175)]
    },

    # Test za plavo-žuti daltonizam (blue_yellowopija)
    # Rjeđi oblik - problem s razlikovanjem plave i žute
    "blue_yellow": {
        # Plave nijanse za broj
        "on": [(70,130,180),(65,105,225),(100,149,237)],
        # Žute nijanse za pozadinu
        "off":[(240,230,140),(250,250,210),(245,245,220)]
    },

    # Kontrolni test - visoki kontrast (svi bi trebali vidjeti)
    # Služi za provjeru da li osoba uopće može vidjeti test ili ima problem s ekranom
    "control": {
        # Tamno siva za broj
        "on":[(40,40,40)],
        # Svijetlo siva za pozadinu
        "off":[(210,210,210)]
    }
}

# ===========================================================
#       FUNKCIJA ZA KREIRANJE MASKE OD TEKSTA
# ===========================================================
# Kreira sliku s brojem koji će služiti kao maska (šablon) gdje će se
# postavljati krugovi "on" boja

def make_text_mask(text):
    # Kreira novu bijelu sliku
    #Image.new() -klasa iz PILow biblioteke sa paramtertima
    #RGB= colormode
    #(SIZE,SIZE)= velicina slike
    #BACKGROUND= boja pozadine (postavljena gore)
    img = Image.new("RGB",(SIZE,SIZE),BACKGROUND)
    # Objekt za crtanje na slici
    d = ImageDraw.Draw(img)

    # Pokušava učitati Arial font, veličina ~45% dimenzije slike
    try:
        font = ImageFont.truetype("arial.ttf", int(SIZE*0.55))
    except:
        # Ako Arial nije dostupan, koristi osnovni font
        font = ImageFont.load_default()

    # Izračunava dimenzije teksta da bi ga centrirao
    box = d.textbbox((0,0),text,font=font)
    #d.textbox()= vraća bounding box (granični okvir) teksta
    #parametri: (0,0) pocetna pozicija od koje mjeri box
    #           text= uneseni tekst
    #           font=koji koristi
    # rezultat vraca tuple sa 4 vrijednosti: (x1, y1, x2, y2)   :
    #           (x1, y1)  gornji lijevi kut pravokutnika
    #           (x2, y2)  donji desni kut pravokutnika 
    # Centriranje po X osi
    x=(SIZE-(box[2]-box[0]))//2
    # Centriranje po Y osi
    y=(SIZE-(box[3]-box[1]))//2
    # Crta tekst crnom bojom na centru slike
    d.text((x,y), text, fill=(0,0,0), font=font)

    return img

# ===========================================
# FUNKCIJE ZA RAD S KRUGOVIMA
# ===========================================
# Kreira nasumični krug unutar kruga s radijusom ~50% veličine slike
# Kreirano uz pomoc naseg mentora i nase slabo poznavanje polarnih koordinata.
# Kod koristenja polarnih koordinata krugovi su ljepse rasporedeni.
def rand_circle(dmin,dmax):
    # Nasumični radijus između min i max promjera
    r=random.uniform(dmin,dmax)/2  #promjer/2
    # Nasumični kut u radijanima (0 do 2π)
    ang=random.random()*math.tau
    # Nasumična udaljenost od centra (ali unutar granica)
    dist=random.random()*(SIZE*0.50-r)
    # Pretvara polarne koordinate (udaljenost, kut) u kartezijske (x,y)
    x=SIZE/2+math.cos(ang)*dist
    y=SIZE/2+math.sin(ang)*dist
    # Vraća tuple (x, y, radijus)
    return (x,y,r)

# Provjerava da li se dva kruga preklapaju
def overlap(a,b):
    # a= [x1,y1,r1], b=[x2,y2,r2] --(x1,y1) i (x2,y2) su centri, a r1 i r2 radijusi krugova
    # Pitagorin poučak: udaljenost između centara
    # Ako je udaljenost manja od zbroja radijusa, krugovi se preklapaju
    return (a[0]-b[0])**2+(a[1]-b[1])**2 < (a[2]+b[2])**2

# Provjerava da li krug dodiruje crni tekst na maski
def touches(mask,c):
    ### Parametri:
    #mask = slika sa tekstom (PIL Image objekt)
    #c = krug, tuple (x, y, r) 
    #x = X koordinata centra kruga
    #y = Y koordinata centra kruga
    #r = radijus kruga
    x,y,r=c
    # Provjerava 5 točaka: centar i 4 točke na rubovima kruga
    for dx,dy in [(0,0),(r,0),(-r,0),(0,r),(0,-r)]:
        px=int(x+dx); py=int(y+dy)
        # Provjerava da li je točka unutar slike
        if 0<=px<SIZE and 0<=py<SIZE:
            # Ako pixel nije bijeli (tj. dodiruje crni tekst), vraća True
            if mask.getpixel((px,py))!=BACKGROUND:
                return True
    return False

# ===============================================
# FUNKCIJA ZA GENERIRANJE ISHIHARA PLOČE
# ==============================================

def generate_plate(text, palette):

    # Kreira masku s brojem
    mask = make_text_mask(text)
    # Kreira praznu bijelu sliku za finalnu ploču
    out = Image.new("RGB",(SIZE,SIZE),BACKGROUND)
    draw = ImageDraw.Draw(out)

    # Minimalni i maksimalni promjer krugova
    dmin=SIZE/60 
    dmax=SIZE/25  
    # Lista za pohranu svih generiranih krugova
    circles=[]

    # Generira zadani broj krugova
    for _ in range(TOTAL_CIRCLES):

        tries=0
        # Pokušava naći poziciju gdje se krug ne preklapa s postojećima
        while True:
            c=rand_circle(dmin,dmax)
            # Provjerava preklapanje sa svim postojećim krugovima
            if not any(overlap(c,c2) for c2 in circles):
                break  # Našao dobru poziciju
            tries+=1
            # Sigurnosni izlaz ako ne može naći poziciju nakon 300 pokušaja
            if tries>300:
                break

        # Dodaje krug u listu
        circles.append(c)

        # Odabire paletu: "on" ako krug dodiruje tekst, inače "off"
        pal = palette["on"] if touches(mask,c) else palette["off"]
        # Nasumično bira boju iz odabrane palete
        col = random.choice(pal)

        # Crta ispunjenu elipsu (krug) s odabranom bojom
        x,y,r=c
        draw.ellipse((x-r,y-r,x+r,y+r), fill=col)

    return out

# ====================================================================
# TESTIRANJE
# ============================================================================

def run_test():

    # Definira redoslijed i nazive testova
    tests = [
        ("control","control"),              # Kontrolni test (prvo)
        ("red_green","red-green"),      # Crveno-zeleni test
        ("blue_yellow","blue-yellow")            # Plavo-žuti test
    ]

    # Rječnici za pohranu rezultata
    results = {}
    real_numbers = {}

    # Izvršava svaki test
    for key,label in tests:

        # Generira NOVI nasumični broj za svaki test (10-99)
        real_number = str(random.randint(10,99))
        #print(real_number)  #za testiranje
        # Pohranjuje stvarni broj
        real_numbers[key] = real_number

        # Ispisuje koji test se izvršava
        print("\nTEST:", label)
        plate = generate_plate(real_number, PALETTES[key])
        plate.show()

        seen = input("What number do you see? ")
        results[key] = (seen == real_number)


    if not results["control"]:
        diagnosis = "vision_problem_or_display"
    elif not results["red_green"]:
        diagnosis = "red_green_deficiency"
    elif not results["blue_yellow"]:
        diagnosis = "blue_yellow_deficiency"
    else:
        diagnosis = "normal_color_vision"

    return real_numbers, results, diagnosis

# ---------------- RUN ----------------

numbers, results, DALTONISM_TYPE = run_test()

print("\nShown numbers:", numbers)
print("Your results:", results)
print("Assessment:", DALTONISM_TYPE)