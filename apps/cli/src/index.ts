#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program.name("app").description("应用命令行").version("0.1.0");

program.parse();
