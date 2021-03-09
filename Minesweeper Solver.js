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
        // while (getValue(x,y) == -1) {}
        resolve();
      }, 5);
    });
  }

  function getBombsAround(x, y, bomb_array) {
    let num = 0;
    for (let i = Math.max(0, x-1); i < Math.min(height, x+2); i++) {
      for (let j = Math.max(0, y-1); j < Math.min(width, y+2); j++) {
        if (bomb_array[i][j] && (i != x || j != y)) {
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
      console.log(bomb_array);
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
                console.log("Set bomb" + i2 + " " + j2);
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
                console.log("normal click" + i2 + " " + j2);
              }
            }
          }
          continue iterate;
        }
      }
    }

    function isValidBoard(number_array) {
      for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
          if (getUnknownSquaresAround(i,j,number_array) < number_array[i][j] && number_array[i][j] != 10) {
            return false;
          }
        }
      }
      return true;
    }

    // More difficult actions
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {

         // Try setting a square as a bomb
        if (number_array[i][j] == -1 && bomb_array[i][j] == 0) {
          bomb_array_copy = JSON.parse(JSON.stringify(bomb_array));
          number_array_copy = JSON.parse(JSON.stringify(number_array));
          bomb_array_copy[i][j] = 1;

          // For each adjacent square, see if it makes any action obvious
          for (let i2 = Math.max(0, i-1); i2 < Math.min(height, i+2); i2++) {
            for (let j2 = Math.max(0, j-1); j2 < Math.min(width, j+2); j2++) {

              // Check to see if we click any squares around the adjacent square
              if ((number_array_copy[i2][j2] == getBombsAround(i2,j2,bomb_array_copy)) && (number_array_copy[i2][j2] != getUnknownSquaresAround(i2,j2,number_array_copy))) {
                number_array_copy2 = JSON.parse(JSON.stringify(number_array_copy));
                for (let i3 = Math.max(0, i2-1); i3 < Math.min(height, i2+2); i3++) {
                  for (let j3 = Math.max(0, j2-1); j3 < Math.min(width, j2+2); j3++) {
                    if ((number_array_copy2[i3][j3] == -1) && (bomb_array_copy[i3][j3] == 0) && (i3 != i2 || j3 != j2)) {
                      number_array_copy2[i3][j3] = 10; // Not a bomb, but we don't know the number
                    }
                  }
                }
                // If the board isn't valid, then the original square must not be a bomb
                if (!isValidBoard(number_array_copy2)) {
                  console.log("Advanced click" + i + "," + j);
                  await clickSquare(i,j);
                  continue iterate;
                }
              }    
            }
          }
        }
        // Try setting it as not a bomb
          // For each adjacent square, see if it makes any action obvious
            // See if that action makes the board impossible
              // If it is impossible, the square is a bomb
      }
    }

    // Hope for the best
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if ((number_array[i][j] == -1) && (bomb_array[i][j] == 0)) {
          await clickSquare(i,j);
          console.log("oh dear click" + i + " " + j);
          continue iterate;
        }
      }
    }

  }

})()