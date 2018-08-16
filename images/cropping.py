import PIL
from PIL import Image

if __name__ == "__main__":
    im = Image.open("card_4color.png")
    width, height = im.size
    nominals = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"]
    types = ["c", "d", "h", "s"]
    for nom in range(0, len(nominals)):
        for typ in range(0, len(types)):
            left_box = int(width*nom/len(nominals))
            right_box = int(width*(nom+1)/len(nominals))
            top_box = int(height*(typ)/len(types))
            bottom_box = int(height*(typ+1)/len(types))
            box = (left_box, top_box, right_box, bottom_box)
            cropped_image = im.crop(box)
            print(box)
            print(nominals[nom]+types[typ]+".png")
            cropped_image.save(nominals[nom]+types[typ]+".png", format="PNG")
