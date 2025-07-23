import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

// Plant genetics system
interface PlantGenetics {
  yield: string; // AA, Aa, aa
  speed: string; // BB, Bb, bb  
  potency: string; // CC, Cc, cc
}

interface Plant {
  id: string;
  name: string;
  stage: 'seed' | 'sprout' | 'vegetative' | 'flowering' | 'harvest';
  progress: number;
  genetics: PlantGenetics;
  traits: {
    yield: number; // 1-10
    speed: number; // 1-10
    potency: number; // 1-10
  };
  plantedAt: number;
}

interface GameStats {
  money: number;
  totalHarvested: number;
  bestYield: number;
  bestPotency: number;
  experimentsCount: number;
}

const WeedGroove = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    money: 1000,
    totalHarvested: 0,
    bestYield: 0,
    bestPotency: 0,
    experimentsCount: 0
  });
  const [selectedTab, setSelectedTab] = useState('farm');
  const [gameTime, setGameTime] = useState(Date.now());

  // Load game state from localStorage
  useEffect(() => {
    const savedGame = localStorage.getItem('weedgroove-save');
    if (savedGame) {
      const data = JSON.parse(savedGame);
      setPlants(data.plants || []);
      setGameStats(data.gameStats || gameStats);
      setGameTime(data.gameTime || Date.now());
    }
  }, []);

  // Save game state
  useEffect(() => {
    const gameData = {
      plants,
      gameStats,
      gameTime
    };
    localStorage.setItem('weedgroove-save', JSON.stringify(gameData));
  }, [plants, gameStats, gameTime]);

  // Game time progression
  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime(prev => prev + 60000); // 1 minute per second
      
      setPlants(prev => prev.map(plant => {
        const timePassed = (gameTime - plant.plantedAt) / 1000 / 60; // minutes
        let newProgress = Math.min(100, (timePassed / (120 - plant.traits.speed * 10)) * 100);
        
        let newStage = plant.stage;
        if (newProgress >= 80) newStage = 'harvest';
        else if (newProgress >= 60) newStage = 'flowering';
        else if (newProgress >= 30) newStage = 'vegetative';
        else if (newProgress >= 10) newStage = 'sprout';
        
        return { ...plant, progress: newProgress, stage: newStage };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameTime]);

  // Generate random genetics
  const generateGenetics = (): PlantGenetics => ({
    yield: ['AA', 'Aa', 'aa'][Math.floor(Math.random() * 3)],
    speed: ['BB', 'Bb', 'bb'][Math.floor(Math.random() * 3)],
    potency: ['CC', 'Cc', 'cc'][Math.floor(Math.random() * 3)]
  });

  // Calculate traits from genetics
  const calculateTraits = (genetics: PlantGenetics) => ({
    yield: genetics.yield === 'AA' ? 8 + Math.floor(Math.random() * 3) :
           genetics.yield === 'Aa' ? 5 + Math.floor(Math.random() * 3) :
           2 + Math.floor(Math.random() * 3),
    speed: genetics.speed === 'BB' ? 8 + Math.floor(Math.random() * 3) :
           genetics.speed === 'Bb' ? 5 + Math.floor(Math.random() * 3) :
           2 + Math.floor(Math.random() * 3),
    potency: genetics.potency === 'CC' ? 8 + Math.floor(Math.random() * 3) :
             genetics.potency === 'Cc' ? 5 + Math.floor(Math.random() * 3) :
             2 + Math.floor(Math.random() * 3)
  });

  const plantSeed = (strain: string) => {
    if (gameStats.money < 50) return;
    
    const genetics = generateGenetics();
    const traits = calculateTraits(genetics);
    
    const newPlant: Plant = {
      id: Date.now().toString(),
      name: strain,
      stage: 'seed',
      progress: 0,
      genetics,
      traits,
      plantedAt: gameTime
    };
    
    setPlants(prev => [...prev, newPlant]);
    setGameStats(prev => ({ ...prev, money: prev.money - 50 }));
  };

  const harvestPlant = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (!plant || plant.stage !== 'harvest') return;
    
    const harvestValue = plant.traits.yield * plant.traits.potency * 10;
    
    setGameStats(prev => ({
      ...prev,
      money: prev.money + harvestValue,
      totalHarvested: prev.totalHarvested + 1,
      bestYield: Math.max(prev.bestYield, plant.traits.yield),
      bestPotency: Math.max(prev.bestPotency, plant.traits.potency)
    }));
    
    setPlants(prev => prev.filter(p => p.id !== plantId));
  };

  const sleepHours = (hours: number) => {
    setGameTime(prev => prev + hours * 60 * 60 * 1000);
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'seed': return 'Dot';
      case 'sprout': return 'Sprout';
      case 'vegetative': return 'TreePine';
      case 'flowering': return 'Flower';
      case 'harvest': return 'Star';
      default: return 'Dot';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'seed': return 'bg-gray-100';
      case 'sprout': return 'bg-plant-200';
      case 'vegetative': return 'bg-plant-400';
      case 'flowering': return 'bg-plant-600';
      case 'harvest': return 'bg-plant-800';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-plant-50 to-plant-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-plant-800 mb-2">🌿 WeedGroove</h1>
          <p className="text-xl text-plant-600">Ферма будущего</p>
          <div className="mt-4 flex justify-center gap-4">
            <Badge variant="secondary" className="bg-plant-100 text-plant-800">
              💰 ${gameStats.money}
            </Badge>
            <Badge variant="secondary" className="bg-plant-100 text-plant-800">
              🌱 Собрано: {gameStats.totalHarvested}
            </Badge>
          </div>
        </header>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="farm">🌱 Ферма</TabsTrigger>
            <TabsTrigger value="genetics">🧬 Генетика</TabsTrigger>
            <TabsTrigger value="lab">🔬 Лаборатория</TabsTrigger>
            <TabsTrigger value="market">🏪 Магазин</TabsTrigger>
            <TabsTrigger value="stats">📊 Статистика</TabsTrigger>
          </TabsList>

          <TabsContent value="farm" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-plant-800">Твоя ферма</h2>
              <div className="flex gap-2">
                <Button onClick={() => sleepHours(6)} variant="outline">
                  😴 Поспать 6ч
                </Button>
                <Button onClick={() => sleepHours(12)} variant="outline">
                  💤 Поспать 12ч
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plants.map(plant => (
                <Card key={plant.id} className={`transition-all duration-300 hover:scale-105 ${getStageColor(plant.stage)}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon name={getStageIcon(plant.stage)} size={20} />
                        {plant.name}
                      </span>
                      <Badge variant="secondary">
                        {plant.stage === 'seed' && '🌰 Семя'}
                        {plant.stage === 'sprout' && '🌱 Росток'}
                        {plant.stage === 'vegetative' && '🌿 Вегетация'}
                        {plant.stage === 'flowering' && '🌸 Цветение'}
                        {plant.stage === 'harvest' && '⭐ Урожай'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={plant.progress} className="mb-4" />
                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">🌾 {plant.traits.yield}</div>
                        <div className="text-xs opacity-70">Урожай</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">⏱️ {plant.traits.speed}</div>
                        <div className="text-xs opacity-70">Скорость</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">💨 {plant.traits.potency}</div>
                        <div className="text-xs opacity-70">Крепость</div>
                      </div>
                    </div>
                    {plant.stage === 'harvest' && (
                      <Button 
                        onClick={() => harvestPlant(plant.id)}
                        className="w-full bg-plant-600 hover:bg-plant-700"
                      >
                        ✂️ Собрать урожай (${plant.traits.yield * plant.traits.potency * 10})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Card className="border-2 border-dashed border-plant-300 hover:border-plant-500 transition-colors">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
                  <Icon name="Plus" size={48} className="text-plant-400 mb-4" />
                  <Button 
                    onClick={() => plantSeed('Случайный сорт')}
                    disabled={gameStats.money < 50}
                    className="bg-plant-500 hover:bg-plant-600"
                  >
                    🌱 Посадить семя ($50)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="genetics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🧬 Система генетики</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-plant-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Как работает генетика:</h3>
                    <ul className="space-y-1 text-sm">
                      <li><strong>AA, BB, CC</strong> - доминантные гены (высокие показатели)</li>
                      <li><strong>Aa, Bb, Cc</strong> - гибридные гены (средние показатели)</li>
                      <li><strong>aa, bb, cc</strong> - рецессивные гены (низкие показатели)</li>
                    </ul>
                  </div>
                  <div className="text-sm text-gray-600">
                    Скрещивание растений позволяет комбинировать лучшие гены и выводить идеальные сорта!
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🔬 Лаборатории</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">🚬 Прямое тестирование</h3>
                    <p className="text-sm text-gray-600 mb-3">Дешево, но неточно (±50%)</p>
                    <Button variant="outline" className="w-full">Бесплатно</Button>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">🔬 Дешевая лаборатория</h3>
                    <p className="text-sm text-gray-600 mb-3">Приблизительные данные (±10%)</p>
                    <Button variant="outline" className="w-full">$100</Button>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2">⚗️ Премиум лаборатория</h3>
                    <p className="text-sm text-gray-600 mb-3">Точные характеристики</p>
                    <Button variant="outline" className="w-full">$500</Button>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🏪 Магазин семян</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Indica Classic', 'Sativa Power', 'Hybrid Dream', 'Auto Flower', 'CBD Special', 'THC Monster'].map(strain => (
                    <Card key={strain} className="p-4">
                      <h3 className="font-semibold mb-2">{strain}</h3>
                      <p className="text-sm text-gray-600 mb-3">Случайная генетика</p>
                      <Button 
                        onClick={() => plantSeed(strain)}
                        disabled={gameStats.money < 50}
                        className="w-full"
                      >
                        $50
                      </Button>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-plant-600">💰</div>
                <div className="text-2xl font-bold">${gameStats.money}</div>
                <div className="text-sm text-gray-600">Текущие деньги</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-plant-600">🌱</div>
                <div className="text-2xl font-bold">{gameStats.totalHarvested}</div>
                <div className="text-sm text-gray-600">Всего собрано</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-plant-600">🏆</div>
                <div className="text-2xl font-bold">{gameStats.bestYield}/10</div>
                <div className="text-sm text-gray-600">Лучший урожай</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-plant-600">⚡</div>
                <div className="text-2xl font-bold">{gameStats.bestPotency}/10</div>
                <div className="text-sm text-gray-600">Макс. крепость</div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WeedGroove;