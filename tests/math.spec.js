const { expect } = require('chai');
const { sum } = require('../math');

describe('Test Sum', () => {

    it('Should return 4', () => {
        let result = sum(2,2);        
        expect(result).to.equal(4);
    });

  });