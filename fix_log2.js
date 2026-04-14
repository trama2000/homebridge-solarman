const fs = require('fs');
let c = fs.readFileSync('src/solarmanApi.ts', 'utf8');

// Update the poll log line to include grid export and round values
let oldLog = c.match(/this\.log\.info\(.*Poll:.*\)/s);
if (oldLog) {
  console.log('Found poll log, updating...');
  // Replace to show grid and round surplus
  c = c.replace(oldLog[0], 
    "this.log.info(" +
    "'[Solarman] Poll: ' +" +
    "'gen=' + (d.generationPower / 1000).toFixed(1) + 'kW ' +" +
    "'use=' + (d.usePower / 1000).toFixed(1) + 'kW ' +" +
    "'bat=' + d.batterySoc + '% ' +" +
    "'batPwr=' + (d.batteryPower / 1000).toFixed(1) + 'kW ' +" +
    "'charge=' + (d.chargePower / 1000).toFixed(1) + 'kW ' +" +
    "'discharge=' + (d.dischargePower / 1000).toFixed(1) + 'kW ' +" +
    "'grid=' + (d.gridPower / 1000).toFixed(1) + 'kW ' +" +
    "'buy=' + (d.purchasePower / 1000).toFixed(1) + 'kW ' +" +
    "'surplus=' + surplus.toFixed(1) + 'kW' +" +
    "(d.irradiateIntensity ? ' irrad=' + d.irradiateIntensity + 'W/m2' : '')" +
    ")"
  );
} else {
  console.log('Poll log not found');
}

fs.writeFileSync('src/solarmanApi.ts', c);
console.log('Done');
