#!/bin/python

import sys
from PIL import Image, ImageChops

# From https://github.com/justCopyBt/geetestCrack/blob/master/geetestCrack.py compute_gap function.
def CalcOffset(fullbg, bg):
    img1 = Image.open(fullbg).convert("RGB")
    img2 = Image.open(bg).convert("RGB")
    diff = ImageChops.difference(img1, img2)
    diff = diff.convert("L")
    table = []
    for i in range(256):
        if i < 40:
            table.append(0)
        else:
            table.append(1)
    diff = diff.point(table, '1')
    left = 43
    for w in range(left, diff.size[0]):
        lis = []
        for h in range(diff.size[1]):
            if diff.load()[w, h] == 1:
                lis.append(w)
            if len(lis) > 5:
                return w
#

if __name__ == "__main__":
    bgpath = "bg.png"
    fbgpath = "fbg.png"

    if(len(sys.argv) >= 3):
        bgpath = sys.argv[2]
        fbgpath = sys.argv[1]

    print({
        "offset": CalcOffset(fbgpath, bgpath) - 3
    })