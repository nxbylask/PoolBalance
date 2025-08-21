import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

const TabsDemo = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Demo de Tabs</h1>
      <Tabs defaultValue="demo1" className="w-full">
        <TabsList>
          <TabsTrigger value="demo1">Demo 1</TabsTrigger>
          <TabsTrigger value="demo2">Demo 2</TabsTrigger>
        </TabsList>
        <TabsContent value="demo1">
          <p>Este es el contenido del Demo 1</p>
        </TabsContent>
        <TabsContent value="demo2">
          <p>Este es el contenido del Demo 2</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TabsDemo;