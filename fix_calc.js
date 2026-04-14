const fs = require('fs');
let c = fs.readFileSync('src/solarmanApi.ts', 'utf8');

// Replace the return block in _getDataInner
const oldReturn = `return {
      generationPower: plant.generationPower || 0,
      usePower: plant.usePower || 0,
      batterySoc: plant.batterySoc || 0,
      buyPower: plant.buyPower || 0,
      gridPower: plant.gridPower || 0,
      batteryPower: plant.batteryPower || 0,
      chargePower: plant.chargePower || 0,
      dischargePower: plant.dischargePower || 0,
      purchasePower: plant.purchasePower || 0,
      irradiateIntensity: plant.irradiateIntensity || 0,
    };`;

const newReturn = `// Real values from API
      const gen = plant.generationPower || 0;
      const use = plant.usePower || 0;
      const grid = plant.gridPower || 0; // positive=exporting, negative=importing
      const soc = plant.batterySoc || 0;
      
      // Calculate battery power: gen - use - grid
      // Positive = charging, negative = discharging
      const batCalc = gen - use - grid;
      
      return {
        generationPower: gen,
        usePower: use,
        batterySoc: soc,
        buyPower: plant.buyPower || 0,
        gridPower: grid,
        batteryPower: batCalc, // calculated: positive=charging, negative=discharging
        chargePower: batCalc > 0 ? batCalc : 0,
        dischargePower: batCalc < 0 ? Math.abs(batCalc) : 0,
        purchasePower: grid < 0 ? Math.abs(grid) : 0, // importing from grid
        irradiateIntensity: plant.irradiateIntensity || 0,
      };`;

c = c.replace(oldReturn, newReturn);

fs.writeFileSync('src/solarmanApi.ts', c);
console.log('Done');
