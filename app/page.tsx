"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Zap, Award, Download, Shuffle, Book, Play, Pause, RefreshCw, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

type CellState = 0 | 1;
type BitLifeGrid = CellState[][];

const GRID_SIZE = 4;
const DAYS = 30;
const EVOLUTIONS_PER_DAY = 288;
const QUALIFICATION_THRESHOLD = 18329471;

const patternLibrary = {
  blinker: [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,0,0,0]],
  toad: [[0,1,1,1], [1,1,1,0], [0,0,0,0], [0,0,0,0]],
  beacon: [[1,1,0,0], [1,0,0,0], [0,0,0,1], [0,0,1,1]],
  pulsar: [[0,1,0,1], [1,0,1,0], [0,1,0,1], [1,0,1,0]],
  glider: [[0,1,0,0], [0,0,1,0], [1,1,1,0], [0,0,0,0]],
};

const BitLifeHashrateCalculator: React.FC = () => {
  const [grid, setGrid] = useState<BitLifeGrid>(Array(GRID_SIZE).fill(Array(GRID_SIZE).fill(0)));
  const [hashrateData, setHashrateData] = useState<{ day: number; hashrate: number }[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState<number>(50);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [generation, setGeneration] = useState<number>(0);

  const toggleCell = (row: number, col: number) => {
    setGrid(prev => prev.map((r, i) =>
      i === row ? r.map((cell, j) => (j === col ? (cell === 0 ? 1 : 0) : cell)) : r
    ));
  };

  const calculateNextGeneration = useCallback((currentGrid: BitLifeGrid): BitLifeGrid => {
    const newGrid: BitLifeGrid = Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0));

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        let neighbors = 0;
        for (let x = -1; x <= 1; x++) {
          for (let y = -1; y <= 1; y++) {
            if (x === 0 && y === 0) continue;
            const newI = (i + x + GRID_SIZE) % GRID_SIZE;
            const newJ = (j + y + GRID_SIZE) % GRID_SIZE;
            neighbors += currentGrid[newI][newJ];
          }
        }

        if (currentGrid[i][j] === 1) {
          newGrid[i][j] = neighbors === 2 || neighbors === 3 ? 1 : 0;
        } else {
          newGrid[i][j] = neighbors === 3 ? 1 : 0;
        }
      }
    }

    return newGrid;
  }, []);

  const calculateHashrate = useCallback((grid: BitLifeGrid): number => {
    return grid.flat().reduce((sum, cell) => sum + cell, 0);
  }, []);

  const runSimulation = useCallback(() => {
    let currentGrid = grid;
    const data: { day: number; hashrate: number }[] = [];
    let totalHashrate = 0;

    for (let day = 1; day <= DAYS; day++) {
      let dailyHashrate = 0;
      for (let evolution = 0; evolution < EVOLUTIONS_PER_DAY; evolution++) {
        currentGrid = calculateNextGeneration(currentGrid);
        dailyHashrate += calculateHashrate(currentGrid);
      }
      totalHashrate += dailyHashrate;
      data.push({ day, hashrate: totalHashrate });
    }

    setHashrateData(data);
  }, [grid, calculateNextGeneration, calculateHashrate]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const animate = useCallback(() => {
    if (!isAnimating) return;

    setGrid(prev => calculateNextGeneration(prev));
    setGeneration(gen => gen + 1);

    setTimeout(animate, 1000 - animationSpeed * 10);
  }, [isAnimating, animationSpeed, calculateNextGeneration]);

  useEffect(() => {
    if (isAnimating) {
      animate();
    }
  }, [isAnimating, animate]);

  const toggleAnimation = () => {
    setIsAnimating(prev => !prev);
  };

  const resetGrid = () => {
    setGrid(Array(GRID_SIZE).fill(Array(GRID_SIZE).fill(0)));
    setGeneration(0);
    setIsAnimating(false);
  };

  const randomizeGrid = () => {
    setGrid(Array(GRID_SIZE).fill(0).map(() => 
      Array(GRID_SIZE).fill(0).map(() => Math.random() > 0.5 ? 1 : 0)
    ));
    setGeneration(0);
  };

  const applyPattern = (pattern: BitLifeGrid) => {
    setGrid(pattern);
    setGeneration(0);
  };

  const mutateGrid = () => {
    setGrid(prev => prev.map(row => 
      row.map(cell => Math.random() < 0.1 ? (cell === 0 ? 1 : 0) : cell)
    ));
    setGeneration(0);
  };

  const downloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Day,Hashrate\n"
      + hashrateData.map(row => `${row.day},${row.hashrate}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bitlife_hashrate.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const finalHashrate = hashrateData[DAYS - 1]?.hashrate || 0;
  const isQualified = finalHashrate > QUALIFICATION_THRESHOLD;

  return (
    <div className="container mx-auto p-4 bg-gray-100 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-4 text-center text-blue-600">HashCraft</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">BitLife Grid</h2>
          <div className="grid grid-cols-4 gap-1 mb-4 bg-white p-2 rounded">
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <button
                  key={`${i}-${j}`}
                  className={`w-12 h-12 rounded-full transition-all duration-300 ${
                    cell ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  onClick={() => toggleCell(i, j)}
                />
              ))
            )}
          </div>
          <div className="flex flex-wrap justify-between mb-4 gap-2">
            <Button onClick={toggleAnimation} variant="outline" className={isAnimating ? "bg-red-100" : "bg-green-100"}>
              {isAnimating ? <Pause className="mr-2" /> : <Play className="mr-2" />}
              {isAnimating ? 'Pause' : 'Play'}
            </Button>
            <Button onClick={resetGrid} variant="outline" className="bg-red-100">
              <RefreshCw className="mr-2" /> Reset
            </Button>
            <Button onClick={randomizeGrid} variant="outline" className="bg-purple-100">
              <Wand2 className="mr-2" /> Randomize
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-blue-100">
                  <Book className="mr-2" /> Patterns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(patternLibrary).map(([name, pattern]) => (
                    <Button
                      key={name}
                      onClick={() => applyPattern(pattern)}
                      variant="outline"
                      className="bg-blue-50 hover:bg-blue-100"
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={mutateGrid} variant="outline" className="bg-yellow-100">
              <Shuffle className="mr-2" /> Mutate
            </Button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Animation Speed</label>
            <Slider
              value={[animationSpeed]}
              onValueChange={(value) => setAnimationSpeed(value[0])}
              max={100}
              step={1}
            />
          </div>
          <div className="text-center text-xl font-bold">
            Generation: {generation}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Hashrate Evolution</h2>
          <div className="bg-white p-2 rounded mb-4" style={{height: '300px'}}>
            <ResponsiveContainer>
              <LineChart data={hashrateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hashrate" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">30-Day Hashrate:</h3>
              <p className="text-2xl font-bold text-blue-600">{finalHashrate.toLocaleString()}</p>
            </div>
            <Button onClick={downloadCSV} variant="outline" className="bg-blue-100">
              <Download className="mr-2" /> Download CSV
            </Button>
          </div>
          {isQualified ? (
            <Alert variant="default" className="bg-green-100 border-green-400 text-green-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Congratulations!</AlertTitle>
              <AlertDescription>
                Your BitLife configuration has qualified for the hackathon with a hashrate of {finalHashrate.toLocaleString()}. Great job!
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="default" className="bg-yellow-100 border-yellow-400 text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Almost There!</AlertTitle>
              <AlertDescription>
                Keep optimizing to reach the qualification threshold of {QUALIFICATION_THRESHOLD.toLocaleString()}.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default BitLifeHashrateCalculator;