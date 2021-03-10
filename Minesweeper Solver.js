(async function() {

  // Find dimensions of board
  const dimensions = [...document.querySelectorAll('.square')][[...document.querySelectorAll('.square')].length-1]["id"].split("_");
  const height = parseInt(dimensions[0]);
  const width = parseInt(dimensions[1])-1;

  function getValue(x, y) {
    let val = $(document.getElementById((x+1) + "_" + (y+1)).classList)[1][4];
    return val == "k" ? -1 : parseInt(val);
  }

  function clickSquare(x, y) {
    return new Promise(resolve => {
      setTimeout(() => {
        let click = new MouseEvent('mouseup');
        $(document.getElementById((x+1) + "_" + (y+1))).trigger(click);
        resolve();
      }, 1);
    });
  }

  function getBombsAround(x, y, bomb_array) {
    let num = 0;
    for (let i = Math.max(0, x-1); i < Math.min(height, x+2); i++) {
      for (let j = Math.max(0, y-1); j < Math.min(width, y+2); j++) {
        if (bomb_array[i][j] && (i != x || j != y)) { 
          // (i != x || j != y) is to ensure we're not considering the actual square
          num++;
        }
      }
    }
    return num;
  }

  function getUnknownSquaresAround(x, y, number_array) {
    let num = 0;
    for (let i = Math.max(0, x-1); i < Math.min(height, x+2); i++) {
      for (let j = Math.max(0, y-1); j < Math.min(width, y+2); j++) {
        if (number_array[i][j] == -1 && (i != x || j != y)) {
          num++;
        }
      }
    }
    return num;
  }

  function isInvalidNumberBombsAndSpacesLeft(bomb_array, number_array) {
    let totalBombs = parseInt($(document.getElementById("mines_ones").classList)[0][4]) 
      + 10*parseInt($(document.getElementById("mines_tens").classList)[0][4])
      + 100*10*parseInt($(document.getElementById("mines_hundreds").classList)[0][4]);
    let numUnknowns = 0;
    let numBombs = 0;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (bomb_array[i][j] == 1) {
          numBombs++;
        }
        if (number_array[i][j] == -1) {
          numUnknowns++;
        }
      }
    }
    if (numUnknowns < totalBombs || numBombs > totalBombs) {
      console.log("Cheeky logic. numUnknowns: " + numUnknowns + ", totalBombs: " + totalBombs + ", numBombs: " + numBombs);
    }
    return numUnknowns < totalBombs || numBombs > totalBombs;
  }

  // Initial setup
  let bomb_array = new Array(height);
  for (let i = 0; i < height; i++) {
    bomb_array[i] = new Array(width);
    for (let j = 0; j < width; j++) {
      bomb_array[i][j] = 0;
    }
  }
  
  // First click
  await clickSquare(Math.floor(height/2),Math.floor(width/2));

  // Repeat until we finish or hit a bomb
  iterate: for (;;) {

    // Check whether the game is finished
    let status = $(document.getElementById("face").classList)[0];
    if ((status == "facedead") || (status == "facewin")) {
      console.log("Finished!");
      break iterate;
    }

    // Get current state of board
    let number_array = new Array(height);
    for (let i = 0; i < height; i++) {
      number_array[i] = new Array(width);
      for (let j = 0; j < width; j++) {
        number_array[i][j] = getValue(i, j);
      }
    }

    // Easy actions
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {

        // Set bombs around
        if ((number_array[i][j] == getUnknownSquaresAround(i,j,number_array)) && (number_array[i][j] != getBombsAround(i,j,bomb_array))) {
          for (let i2 = Math.max(0, i-1); i2 < Math.min(height, i+2); i2++) {
            for (let j2 = Math.max(0, j-1); j2 < Math.min(width, j+2); j2++) {
              if (number_array[i2][j2] == -1 && (i2 != i || j2 != j)) {
                bomb_array[i2][j2] = 1;
              }
            }
          }
          continue iterate;
        }
        // Click squares around
        if ((number_array[i][j] == getBombsAround(i,j,bomb_array)) && (number_array[i][j] != getUnknownSquaresAround(i,j,number_array))) {
          for (let i2 = Math.max(0, i-1); i2 < Math.min(height, i+2); i2++) {
            for (let j2 = Math.max(0, j-1); j2 < Math.min(width, j+2); j2++) {
              if ((number_array[i2][j2] == -1) && (bomb_array[i2][j2] == 0) && (i2 != i || j2 != j)) {
                await clickSquare(i2, j2);
              }
            }
          }
          continue iterate;
        }
      }
    }

    // More difficult actions
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {

         // Try setting a square as a bomb
        if (number_array[i][j] == -1 && bomb_array[i][j] == 0) {
          bomb_array_copy = JSON.parse(JSON.stringify(bomb_array));
          bomb_array_copy[i][j] = 1;

          // For each adjacent square, see if it makes any action obvious
          for (let i2 = Math.max(0, i-1); i2 < Math.min(height, i+2); i2++) {
            for (let j2 = Math.max(0, j-1); j2 < Math.min(width, j+2); j2++) {

              // Check to see if we click any squares around the adjacent square
              if ((number_array[i2][j2] == getBombsAround(i2,j2,bomb_array_copy)) && (number_array[i2][j2] != getUnknownSquaresAround(i2,j2,number_array))) {
                number_array_copy = JSON.parse(JSON.stringify(number_array));
                for (let i3 = Math.max(0, i2-1); i3 < Math.min(height, i2+2); i3++) {
                  for (let j3 = Math.max(0, j2-1); j3 < Math.min(width, j2+2); j3++) {
                    if ((number_array_copy[i3][j3] == -1) && (bomb_array_copy[i3][j3] == 0) && (i3 != i2 || j3 != j2)) {
                      number_array_copy[i3][j3] = 10; // Not a bomb, but we don't know the number
                    }
                  }
                }
                let invalid = isInvalidNumberBombsAndSpacesLeft(bomb_array_copy, number_array_copy);
                for (let i3 = 0; i3 < height; i3++) {
                  for (let j3 = 0; j3 < width; j3++) {
                    // If the board isn't valid, then the original square must not be a bomb
                    invalid |= (getUnknownSquaresAround(i3,j3,number_array_copy) < number_array_copy[i3][j3] && number_array_copy[i3][j3] != 10);
                    if (invalid) {
                      await clickSquare(i,j);
                      continue iterate;
                    }
                  }
                }
              }    
            }
          }
        }

        // Try setting it as not a bomb
        if (number_array[i][j] == -1 && bomb_array[i][j] == 0) {
          bomb_array_copy = JSON.parse(JSON.stringify(bomb_array));
          number_array_copy = JSON.parse(JSON.stringify(number_array));
          number_array_copy[i][j] = 10;

          // For each adjacent square, see if it makes any action obvious
          for (let i2 = Math.max(0, i-1); i2 < Math.min(height, i+2); i2++) {
            for (let j2 = Math.max(0, j-1); j2 < Math.min(width, j+2); j2++) {

              // Check to see if we set any bombs around the adjacent square
              if ((number_array_copy[i2][j2] == getUnknownSquaresAround(i2,j2,number_array_copy)) && (number_array_copy[i2][j2] != getBombsAround(i2,j2,bomb_array_copy))) {
                for (let i3 = Math.max(0, i2-1); i3 < Math.min(height, i2+2); i3++) {
                  for (let j3 = Math.max(0, j2-1); j3 < Math.min(width, j2+2); j3++) {
                    if (number_array_copy[i3][j3] == -1 && (i3 != i2 || j3 != j2)) {
                      bomb_array_copy[i3][j3] = 1;
                    }
                  }
                }
                let invalid = isInvalidNumberBombsAndSpacesLeft(bomb_array_copy, number_array_copy);
                for (let i3 = 0; i3 < height; i3++) {
                  for (let j3 = 0; j3 < width; j3++) {
                    // If the board isn't valid, then the original square must be a bomb
                    invalid |= (getBombsAround(i3,j3,bomb_array_copy) > number_array_copy[i3][j3] && number_array_copy[i3][j3] != -1);
                    if (invalid) {
                      bomb_array[i][j] = 1;
                      continue iterate;
                    }
                  }
                }
              }    
            }
          }
        }
      }
    }

    // Future: Find the lowest odds at each square

    // Hope for the best
    let bestOdds = 0;
    let bestOddX, bestOddY = 0;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (number_array[i][j] != -1) {
          let numBombsLeft = number_array[i][j]-getBombsAround(i,j,bomb_array);
          let numUnknownSpacesLeft = getUnknownSquaresAround(i,j,number_array)-getBombsAround(i,j,bomb_array);
          if (numBombsLeft != 0) {
            let odds = numUnknownSpacesLeft/numBombsLeft;
            if (odds > bestOdds) {
              bestOdds = odds;
              bestOddX = i;
              bestOddY = j;
            }
          }
        }
      }
    }
    for (let i = Math.max(0, bestOddX-1); i < Math.min(height, bestOddX+2); i++) {
      for (let j = Math.max(0, bestOddY-1); j < Math.min(width, bestOddY+2); j++) { 
        if ((number_array[i][j] == -1) && (bomb_array[i][j] == 0) && (i != bestOddX || j != bestOddY)) {
          await clickSquare(i,j);
          console.log("Guess " + i + "," + j + " with failure odds 1 in " + bestOdds + " from square " + bestOddX + "," + bestOddY);
          continue iterate;
        }
      }
    }
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (number_array[i][j] == -1 && bomb_array[i][j] == 0) {
          await clickSquare(i,j);
          console.log("Guess " + i + "," + j + " with unknown failure odds");
          continue iterate;
        }
      }
    }
  }
})()
