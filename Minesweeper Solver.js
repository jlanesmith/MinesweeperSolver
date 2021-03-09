(async function() {

  // Find dimensions of board
  const dimensions = [...document.querySelectorAll('.square')][[...document.querySelectorAll('.square')].length-1]["id"].split("_");
  const height = parseInt(dimensions[0]);
  const length = parseInt(dimensions[1])-1;

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
      for (let j = Math.max(0, y-1); j < Math.min(length, y+2); j++) {
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
      for (let j = Math.max(0, y-1); j < Math.min(length, y+2); j++) {
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
    bomb_array[i] = new Array(length);
    for (let j = 0; j < length; j++) {
      bomb_array[i][j] = 0;
    }
  }
  
  // First click
  await clickSquare(Math.floor(height/2),Math.floor(length/2));

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
      number_array[i] = new Array(length);
      for (let j = 0; j < length; j++) {
        number_array[i][j] = getValue(i, j);
      }
    }

    // Easy actions
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < length; j++) {

        // Set bombs around
        if ((number_array[i][j] == getUnknownSquaresAround(i,j,number_array)) && (number_array[i][j] != getBombsAround(i,j,bomb_array))) {
          for (let i2 = Math.max(0, i-1); i2 < Math.min(height, i+2); i2++) {
            for (let j2 = Math.max(0, j-1); j2 < Math.min(length, j+2); j2++) {
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
            for (let j2 = Math.max(0, j-1); j2 < Math.min(length, j+2); j2++) {
              if ((number_array[i2][j2] == -1) && (bomb_array[i2][j2] == 0) && (i2 != i || j2 != j)) {
                await clickSquare(i2, j2);
                console.log("click" + i2 + " " + j2);
              }
            }
          }
          continue iterate;
        }
      }
    }

    // Hope for the best
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < length; j++) {
        if ((number_array[i][j] == -1) && (bomb_array[i][j] == 0)) {
          await clickSquare(i,j);
          console.log("oh dear click" + i + " " + j);
          continue iterate;
        }
      }
    }

  }

})()