import * as core from '@actions/core'
import * as github from '@actions/github'
import {run} from './lib/actions.js'
import {fileURLToPath} from 'url'

export const action = () => run(async () => {
  const inputs = {
    redact: core.getInput('redact')
        ?.split(/\s*[,\n]\s*/)
        ?.map((it) => {
          const regexMatch = it.match(/^\/(?<pattern>.+)\/(?<flags>[igmd]*)/)
          if (regexMatch) {
            return new RegExp(regexMatch.groups?.pattern ?? '', regexMatch.groups?.flags)
          }
          return it
        }) ?? [],
  }

  let eventInputs
  switch (github.context.eventName) {
    case 'repository_dispatch':
      eventInputs = github.context.payload.client_payload
      break
    case 'workflow_dispatch':
    default:
      eventInputs = github.context.payload.inputs
  }

  if (eventInputs) {
    core.info('Inputs:')
    for (const [key, value] of Object.entries(eventInputs)) {
      if (key === '') continue
      if (keyValueShouldBeRedacted(key)) {
        core.info(`  ${key}: ***`)
        if (isPrimitive(value)) {
          core.setSecret(value.toString())
        }
      } else {
        core.info(`  ${key}: ${JSON.stringify(value)}`)
      }
      core.setOutput(key, value)
    }
  } else {
    core.info('No inputs.')
  }

  /**
   * Check if key should be redacted
   * @param key - key to check
   * @return true if key should be redacted
   */
  function keyValueShouldBeRedacted(key: string) {
    return inputs.redact.some((redactPattern) => {
      if (typeof redactPattern === 'string') {
        return key === redactPattern
      }
      return redactPattern.test(key)
    })
  }
})

/**
 * Check if value is a primitive
 * @param value - value to check
 * @return true if value is a primitive
 */
function isPrimitive(value: unknown): value is string | number | bigint | boolean {
  return typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'boolean'
}

// Execute the action, if running as main module
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  action()
}
